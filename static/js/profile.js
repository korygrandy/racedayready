import * as elements from './elements.js';
import { showMessage, createHelmetIcon, showConfirmationModal } from './ui.js';
import { applyTheme } from './theme.js';
import { App } from './main.js';
import { updateRacedayCountdown } from './schedule.js';

let currentProfileForPinSettings = null;

/**
 * Logs all of a user's events that are flagged as a Raceday for debugging.
 * @param {object} profile - The user profile object.
 */
const logRacedayEvents = async (profile) => {
    console.log(`[DEBUG] Checking for all Raceday events for user: ${profile.username}`);
    try {
        const response = await fetch(`/get-events/${profile.id}`);
        const data = await response.json();
        if (data.success && data.events) {
            const racedayEvents = data.events.filter(event => event.is_raceday === true);
            if (racedayEvents.length > 0) {
                console.log(`[DEBUG] Found ${racedayEvents.length} event(s) flagged as a Raceday:`, racedayEvents);
            } else {
                console.log("[DEBUG] No events flagged as a Raceday found for this user.");
            }
        } else {
            console.warn("[DEBUG] Could not fetch event list for logging.");
        }
    } catch (error) {
        console.error("[DEBUG] Error fetching event list for logging:", error);
    }
};

export const checkProfileStatus = () => {
    if (!App.currentUser) return;

    console.log("[INFO] Checking profile status for garages and vehicles...");

    fetch(`/get-garages/${App.currentUser.id}`)
        .then(res => res.json())
        .then(garageData => {
            if (garageData.success && garageData.garages.length === 0) {
                showMessage('Reminder: No garages found. Please add a garage.', false);
            }
            return fetch(`/get-vehicles/${App.currentUser.id}`);
        })
        .then(res => res.json())
        .then(vehicleData => {
            if (vehicleData.success && vehicleData.vehicles.length === 0) {
                showMessage('Reminder: No vehicles found. Please add a vehicle.', false);
            }
        })
        .catch(error => console.error("[ERROR] Error checking profile status:", error));
};

const hideProfileModal = () => {
    console.log("[DEBUG] Hiding create profile modal.");
    elements.profileModal.classList.add('hidden');
};

const showProfileModal = () => {
    console.log("[DEBUG] Showing create profile modal.");
    hideSelectProfileModal();
    elements.profileForm.reset();
    elements.pinInput.disabled = true;
    elements.themeSelect.value = 'dark'; // Default to dark
    elements.profileModal.classList.remove('hidden');
};

const hideSelectProfileModal = () => {
    console.log("[DEBUG] Hiding select profile modal.");
    elements.selectProfileModal.classList.add('hidden');
};

const hidePinEntryModal = () => {
    console.log("[DEBUG] Hiding PIN entry modal.");
    elements.pinEntryModal.classList.add('hidden');
};

const hidePinSettingsModal = () => {
    console.log("[DEBUG] Hiding PIN settings modal.");
    elements.pinSettingsModal.classList.add('hidden');
};

const executeDelete = (profileId) => {
    fetch(`/delete-profile/${profileId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            hidePinEntryModal();
            elements.devPinEntryModal.classList.add('hidden');
            checkProfiles();
        }
    })
    .catch(error => {
        console.error('[ERROR] Error deleting profile:', error);
        showMessage('Failed to delete profile.', false);
    });
};

const showPinEntryModal = (profile, forDelete = false) => {
    console.log(`[INFO] Showing PIN entry modal for ${profile.username}. For delete: ${forDelete}`);
    elements.pinEntryText.textContent = forDelete ? `Enter PIN to delete ${profile.username}` : `Enter PIN for ${profile.username}`;
    elements.pinEntryInput.value = '';
    elements.pinEntryModal.classList.remove('hidden');
    elements.pinEntryInput.focus();

    elements.pinEntryForm.onsubmit = (e) => {
        e.preventDefault();
        const pin = elements.pinEntryInput.value;
        fetch(`/verify-pin/${profile.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (forDelete) {
                    executeDelete(profile.id);
                } else {
                    selectProfile(profile);
                }
            } else {
                showMessage(data.message, false);
            }
        })
        .catch(error => {
            console.error('[ERROR] Error verifying PIN:', error);
            showMessage('Failed to verify PIN.', false);
        });
    };
};

const showAdminPinForDelete = (profile) => {
    console.log(`[INFO] Showing admin PIN modal for deleting ${profile.username}`);
    elements.devPinEntryModal.classList.remove('hidden');
    elements.devPinEntryInput.focus();

    elements.devPinEntryForm.onsubmit = async (e) => {
        e.preventDefault();
        const enteredPin = elements.devPinEntryInput.value;

        try {
            const response = await fetch('/get-admin-pin');
            const data = await response.json();

            if (data.success && enteredPin === data.pin) {
                console.log("[INFO] Admin PIN correct. Executing delete.");
                executeDelete(profile.id);
            } else {
                showMessage('Incorrect Admin PIN.', false);
            }
        } catch (error) {
            console.error("[ERROR] Error verifying admin PIN:", error);
            showMessage("An error occurred during verification.", false);
        } finally {
            elements.devPinEntryInput.value = '';
        }
    };
};

const showPinEntryForDelete = (profile) => {
    showPinEntryModal(profile, true);
};

const showPinSettingsModal = (profile) => {
    console.log(`[INFO] Showing PIN settings modal for ${profile.username}`);
    currentProfileForPinSettings = profile;
    elements.pinSettingsHeading.textContent = `PIN Settings for ${profile.username}`;
    elements.editEnablePinCheckbox.checked = profile.pinEnabled;
    elements.editPinInput.disabled = !profile.pinEnabled;
    elements.editPinInput.value = ''; // Always clear for security
    elements.pinSettingsModal.classList.remove('hidden');
};

const selectProfile = (profile) => {
    App.currentUser = profile;
    applyTheme(profile.theme);
    hideSelectProfileModal();
    hidePinEntryModal();

    updateRacedayCountdown();
    logRacedayEvents(profile);

    fetch('/get-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);

        if (data.success) {
            App.setView('features');
            elements.featuresUsername.textContent = profile.username;
            elements.featuresHelmetDisplay.innerHTML = '';
            elements.featuresHelmetDisplay.appendChild(createHelmetIcon(profile.helmetColor, 'w-12 h-12'));
        }
    })
    .catch(error => {
        console.error('[ERROR] Error selecting profile:', error);
        showMessage('An error occurred while selecting the profile.', false);
    });
};

export const updateProfile = (profileId, updates, refreshList = true) => {
    fetch(`/update-profile/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    })
    .then(response => response.json())
    .then(data => {
        if (refreshList) showMessage(data.message, data.success);
        if (data.success && refreshList) {
            checkProfiles();
        }
    })
    .catch(error => {
        console.error('[ERROR] Error updating profile:', error);
        showMessage('Failed to update profile.', false);
    });
};

const showSelectProfileModal = (profiles, limitReached) => {
    console.log(`[DEBUG] Showing select profile modal. Profiles: ${profiles.length}, Limit Reached: ${limitReached}`);
    elements.profileList.innerHTML = '';
    profiles.forEach(profile => {
        const container = document.createElement('div');
        container.className = 'group flex items-center justify-between p-3 bg-interactive-hover rounded-md';
        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-center flex-grow';
        const helmetContainer = document.createElement('div');
        helmetContainer.className = 'w-8 h-8 mr-3 relative cursor-pointer';
        helmetContainer.title = 'Click to change color';
        const helmetIcon = createHelmetIcon(profile.helmetColor);
        helmetContainer.appendChild(helmetIcon);
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = profile.helmetColor;
        colorInput.className = 'absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer';
        helmetContainer.appendChild(colorInput);
        colorInput.addEventListener('input', (e) => {
            helmetIcon.querySelector('path').setAttribute('fill', e.target.value);
        });
        colorInput.addEventListener('change', (e) => {
            console.log(`[DEBUG] Profile color changed for ${profile.username}`);
            updateProfile(profile.id, { helmetColor: e.target.value });
        });
        const nameSpan = document.createElement('span');
        nameSpan.textContent = profile.username;
        nameSpan.className = 'cursor-pointer hover:text-blue-400';
        nameSpan.title = 'Click to edit';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = profile.username;
        nameInput.maxLength = 12;
        nameInput.className = 'hidden flex-grow bg-input rounded px-2 py-1';
        nameSpan.onclick = () => {
            nameSpan.classList.add('hidden');
            nameInput.classList.remove('hidden');
            nameInput.focus();
        };
        const saveEdit = () => {
            const newUsername = nameInput.value.trim();
            if (newUsername && newUsername !== profile.username) {
                console.log(`[DEBUG] Profile username updated for ${profile.id}`);
                updateProfile(profile.id, { username: newUsername });
            } else {
                nameInput.classList.add('hidden');
                nameSpan.classList.remove('hidden');
            }
        };
        nameInput.onblur = saveEdit;
        nameInput.onkeydown = (e) => {
            if (e.key === 'Enter') saveEdit();
            else if (e.key === 'Escape') {
                nameInput.value = profile.username;
                nameInput.classList.add('hidden');
                nameSpan.classList.remove('hidden');
            }
        };
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'flex items-center';
        const pinButton = document.createElement('button');
        pinButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`;
        pinButton.className = 'ml-4 text-text-secondary hover:text-text-primary';
        pinButton.title = 'Edit PIN Settings';
        pinButton.onclick = () => {
            console.log(`[INFO] Click Event: Edit PIN for profile '${profile.username}'.`);
            showPinSettingsModal(profile);
        };
        const selectButton = document.createElement('button');
        selectButton.textContent = 'Select';
        selectButton.className = 'ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white';
        selectButton.onclick = () => {
            console.log(`[INFO] Click Event: Selected profile '${profile.username}'.`);
            if (profile.pinEnabled) {
                showPinEntryModal(profile);
            } else {
                selectProfile(profile);
            }
        };
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '&times;';
        deleteButton.className = 'ml-2 text-red-500 hover:text-red-400 font-bold text-2xl px-2';
        deleteButton.onclick = () => {
            console.log(`[INFO] Click Event: Delete initiated for profile '${profile.username}'.`);
            showConfirmationModal(
                `Are you sure you want to delete the profile for "${profile.username}"? This action cannot be undone.`,
                () => {
                    if (profile.pinEnabled) {
                        showPinEntryForDelete(profile);
                    } else {
                        showAdminPinForDelete(profile);
                    }
                }
            );
        };
        leftSection.appendChild(helmetContainer);
        leftSection.appendChild(nameSpan);
        leftSection.appendChild(nameInput);
        container.appendChild(leftSection);
        buttonGroup.appendChild(pinButton);
        buttonGroup.appendChild(selectButton);
        buttonGroup.appendChild(deleteButton);
        container.appendChild(buttonGroup);
        elements.profileList.appendChild(container);
    });

    if (limitReached) {
        elements.addNewProfileBtn.disabled = true;
        elements.addNewProfileBtn.textContent = 'Profile Limit Reached';
        elements.addNewProfileBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        elements.addNewProfileBtn.disabled = false;
        elements.addNewProfileBtn.textContent = 'Add New Profile';
        elements.addNewProfileBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    elements.selectProfileModal.classList.remove('hidden');
};

export const checkProfiles = () => {
    console.log("[INFO] Checking for existing profiles...");
    return fetch('/check-profiles')
        .then(response => response.json())
        .then(data => {
            if (data.profiles && data.profiles.length > 0) {
                showSelectProfileModal(data.profiles, data.limit_reached);
            } else {
                showProfileModal();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error checking profiles:', error);
            showMessage('An error occurred while checking profiles.', false);
        });
};

export const initProfiles = () => {
    elements.enablePinCheckbox.addEventListener('change', (e) => {
        elements.pinInput.disabled = !e.target.checked;
        console.log(`[DEBUG] PIN input enabled state changed to: ${!elements.pinInput.disabled}`);
        if (!e.target.checked) {
            elements.pinInput.value = '';
        }
    });

    elements.profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("[INFO] Click Event: 'Save Profile' button clicked.");
        const username = elements.usernameInput.value.trim();
        const helmetColor = elements.helmetColorInput.value;
        const pinEnabled = elements.enablePinCheckbox.checked;
        const pin = elements.pinInput.value;
        const theme = elements.themeSelect.value;

        if (!username) {
            showMessage('Username is required.', false);
            return;
        };
        if (pinEnabled && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
            showMessage('PIN must be 4 digits.', false);
            return;
        }

        elements.saveProfileBtn.disabled = true;
        elements.saveProfileBtn.textContent = 'Saving...';

        fetch('/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, helmetColor, pinEnabled, pin, theme }),
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                hideProfileModal();
                checkProfiles();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error creating profile:', error);
            showMessage('Failed to create profile.', false);
        })
        .finally(() => {
            elements.saveProfileBtn.disabled = false;
            elements.saveProfileBtn.textContent = 'Save Profile';
        });
    });

    elements.cancelCreateBtn.addEventListener('click', () => {
        console.log("[INFO] Click Event: 'Cancel Create Profile' button clicked.");
        hideProfileModal();
        checkProfiles();
    });

    elements.addNewProfileBtn.addEventListener('click', () => {
        console.log("[INFO] Click Event: 'Add New Profile' button clicked.");
        showProfileModal();
    });

    elements.cancelPinEntryBtn.addEventListener('click', () => {
        hidePinEntryModal();
    });

    elements.pinSettingsForm.onsubmit = (e) => {
        e.preventDefault();
        const pinEnabled = elements.editEnablePinCheckbox.checked;
        const pin = elements.editPinInput.value;

        if (pinEnabled && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
            showMessage('New PIN must be 4 digits.', false);
            return;
        }
        if (currentProfileForPinSettings) {
            updateProfile(currentProfileForPinSettings.id, { pinEnabled, pin });
        }
        hidePinSettingsModal();
    };

    elements.editEnablePinCheckbox.addEventListener('change', (e) => {
        elements.editPinInput.disabled = !e.target.checked;
        if (!e.target.checked) {
            elements.editPinInput.value = '';
        }
    });

    elements.cancelPinSettingsBtn.addEventListener('click', () => {
        hidePinSettingsModal();
    });
};
