
// --- Element Selection ---
const readyButton = document.getElementById('ready-button');
const messageBox = document.getElementById('message-box');
const devModeBtn = document.getElementById('dev-mode-btn');
const backToAppBtn = document.getElementById('back-to-app-btn');
const mainView = document.getElementById('main-view');
const developerView = document.getElementById('developer-view');
const featuresView = document.getElementById('features-view');
const featuresHelmetDisplay = document.getElementById('features-helmet-display');
const featuresUsername = document.getElementById('features-username');
const profileHeaderBtn = document.getElementById('profile-header-btn');

const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username-input');
const helmetColorInput = document.getElementById('helmet-color-input');
const enablePinCheckbox = document.getElementById('enable-pin-checkbox');
const pinInput = document.getElementById('pin-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
const cancelCreateBtn = document.getElementById('cancel-create-btn');

const selectProfileModal = document.getElementById('select-profile-modal');
const profileList = document.getElementById('profile-list');
const addNewProfileBtn = document.getElementById('add-new-profile-btn');

const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const deleteConfirmText = document.getElementById('delete-confirm-text');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

const pinEntryModal = document.getElementById('pin-entry-modal');
const pinEntryText = document.getElementById('pin-entry-text');
const pinEntryForm = document.getElementById('pin-entry-form');
const pinEntryInput = document.getElementById('pin-entry-input');
const cancelPinEntryBtn = document.getElementById('cancel-pin-entry-btn');

const pinSettingsModal = document.getElementById('pin-settings-modal');
const pinSettingsHeading = document.getElementById('pin-settings-heading');
const pinSettingsForm = document.getElementById('pin-settings-form');
const editEnablePinCheckbox = document.getElementById('edit-enable-pin-checkbox');
const editPinInput = document.getElementById('edit-pin-input');
const cancelPinSettingsBtn = document.getElementById('cancel-pin-settings-btn');


// --- View Toggling Logic ---
const setView = (viewName) => {
    mainView.classList.add('hidden');
    developerView.classList.add('hidden');
    featuresView.classList.add('hidden');

    const isDevMode = viewName === 'developer';
    devModeBtn.classList.toggle('hidden', isDevMode);

    if (isDevMode) {
        developerView.classList.remove('hidden');
    } else if (viewName === 'features') {
        featuresView.classList.remove('hidden');
    } else {
        mainView.classList.remove('hidden');
    }
};

devModeBtn.addEventListener('click', () => {
    console.log("Click Event: 'Developer Mode' button clicked.");
    setView('developer');
});

backToAppBtn.addEventListener('click', () => {
    console.log("Click Event: 'Back to App' button clicked.");
    setView('main');
});

profileHeaderBtn.addEventListener('click', () => {
    console.log("Click Event: 'Profile Header' button clicked.");
    setView('main'); // Hide the features view
    checkProfiles(); // Show the profile selection modal
});


// --- Message Box Logic ---
const showMessage = (message, isSuccess) => {
    messageBox.textContent = message;
    messageBox.classList.remove('bg-green-500', 'bg-red-500');
    messageBox.classList.add(isSuccess ? 'bg-green-500' : 'bg-red-500');

    messageBox.classList.remove('opacity-0', 'translate-y-10');
    messageBox.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        messageBox.classList.remove('opacity-100', 'translate-y-0');
        messageBox.classList.add('opacity-0', 'translate-y-10');
    }, 3000);
};

// --- Profile Modal Logic ---
const showProfileModal = () => {
    hideSelectProfileModal();
    profileModal.classList.remove('hidden');
};

const hideProfileModal = () => {
    profileModal.classList.add('hidden');
};

enablePinCheckbox.addEventListener('change', () => {
    pinInput.disabled = !enablePinCheckbox.checked;
    if (!enablePinCheckbox.checked) {
        pinInput.value = '';
    }
});

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Click Event: 'Save Profile' button clicked.");
    const username = usernameInput.value.trim();
    const helmetColor = helmetColorInput.value;
    const pinEnabled = enablePinCheckbox.checked;
    const pin = pinInput.value;

    if (!username) return;
    if (pinEnabled && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
        showMessage('PIN must be 4 digits.', false);
        return;
    }

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Saving...';

    fetch('/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, helmetColor, pinEnabled, pin }),
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
        console.error('Error:', error);
        showMessage('Failed to create profile.', false);
    })
    .finally(() => {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Save Profile';
    });
});

cancelCreateBtn.addEventListener('click', () => {
    console.log("Click Event: 'Cancel Create Profile' button clicked.");
    hideProfileModal();
    checkProfiles(); // Go back to the selection screen
});

// --- Helmet Icon Creation ---
const createHelmetIcon = (color, sizeClass = 'w-8 h-8') => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('class', sizeClass);
    svg.setAttribute('viewBox', '0 0 50 50');

    const helmetPath = document.createElementNS(svgNS, 'path');
    helmetPath.setAttribute('d', 'M25,5 C10,5 5,20 5,30 C5,45 15,45 25,45 C35,45 45,45 45,30 C45,20 40,5 25,5 Z');
    helmetPath.setAttribute('fill', color);
    helmetPath.setAttribute('stroke', '#4A5568'); // gray-600
    helmetPath.setAttribute('stroke-width', '2');

    const visor = document.createElementNS(svgNS, 'rect');
    visor.setAttribute('x', '15');
    visor.setAttribute('y', '20');
    visor.setAttribute('width', '20');
    visor.setAttribute('height', '10');
    visor.setAttribute('fill', '#2D3748'); // gray-800
    visor.setAttribute('rx', '2');

    svg.appendChild(helmetPath);
    svg.appendChild(visor);

    return svg;
};


// --- Select Profile Modal Logic ---
const showSelectProfileModal = (profiles) => {
    profileList.innerHTML = ''; // Clear existing list
    profiles.forEach(profile => {
        const container = document.createElement('div');
        container.className = 'group flex items-center justify-between p-3 bg-gray-700 rounded-md';

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
            updateProfile(profile.id, { helmetColor: e.target.value });
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = profile.username;
        nameSpan.className = 'cursor-pointer hover:text-blue-400';
        nameSpan.title = 'Click to edit';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = profile.username;
        nameInput.className = 'hidden flex-grow bg-gray-600 text-white rounded px-2 py-1';

        nameSpan.onclick = () => {
            nameSpan.classList.add('hidden');
            nameInput.classList.remove('hidden');
            nameInput.focus();
        };

        const saveEdit = () => {
            const newUsername = nameInput.value.trim();
            if (newUsername && newUsername !== profile.username) {
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
        pinButton.className = 'ml-4 text-gray-400 hover:text-white';
        pinButton.title = 'Edit PIN Settings';
        pinButton.onclick = () => {
            console.log(`Click Event: Edit PIN for profile '${profile.username}'.`);
            showPinSettingsModal(profile);
        };

        const selectButton = document.createElement('button');
        selectButton.textContent = 'Select';
        selectButton.className = 'ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm';
        selectButton.onclick = () => {
            console.log(`Click Event: Selected profile '${profile.username}'.`);
            if (profile.pinEnabled) {
                showPinEntryModal(profile);
            } else {
                selectProfile(profile.username, profile.helmetColor);
            }
        };

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '&times;';
        deleteButton.className = 'ml-2 text-red-500 hover:text-red-400 font-bold text-2xl px-2';
        deleteButton.onclick = () => {
            console.log(`Click Event: Delete initiated for profile '${profile.username}'.`);
            showDeleteConfirmModal(profile.id, profile.username);
        };

        leftSection.appendChild(helmetContainer);
        leftSection.appendChild(nameSpan);
        leftSection.appendChild(nameInput);
        container.appendChild(leftSection);
        buttonGroup.appendChild(pinButton);
        buttonGroup.appendChild(selectButton);
        buttonGroup.appendChild(deleteButton);
        container.appendChild(buttonGroup);
        profileList.appendChild(container);
    });
    selectProfileModal.classList.remove('hidden');
};

const hideSelectProfileModal = () => {
    selectProfileModal.classList.add('hidden');
};

const selectProfile = (username, helmetColor) => {
    hideSelectProfileModal();
    hidePinEntryModal();
    fetch('/get-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            featuresUsername.textContent = username;
            featuresHelmetDisplay.innerHTML = ''; // Clear previous icon
            featuresHelmetDisplay.appendChild(createHelmetIcon(helmetColor, 'w-12 h-12'));
            setView('features');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred.', false);
    });
};

const updateProfile = (profileId, updates) => {
    fetch(`/update-profile/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            checkProfiles(); // Refresh the list to show the updated name/color
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Failed to update profile.', false);
    });
};

addNewProfileBtn.addEventListener('click', () => {
    console.log("Click Event: 'Add New Profile' button clicked.");
    showProfileModal();
});

// --- Delete Confirmation Modal Logic ---
const showDeleteConfirmModal = (profileId, username) => {
    deleteConfirmText.textContent = `Are you sure you want to delete the profile for "${username}"?`;
    deleteConfirmModal.classList.remove('hidden');

    confirmDeleteBtn.onclick = () => {
        console.log(`Click Event: Confirmed deletion for profile '${username}'.`);
        executeDelete(profileId);
    };
};

const hideDeleteConfirmModal = () => {
    deleteConfirmModal.classList.add('hidden');
};

cancelDeleteBtn.addEventListener('click', () => {
    console.log("Click Event: Canceled profile deletion.");
    hideDeleteConfirmModal();
});

const executeDelete = (profileId) => {
    fetch(`/delete-profile/${profileId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            hideDeleteConfirmModal();
            checkProfiles();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Failed to delete profile.', false);
    });
};

// --- PIN Entry Modal Logic ---
const showPinEntryModal = (profile) => {
    pinEntryText.textContent = `Enter PIN for ${profile.username}`;
    pinEntryInput.value = '';
    pinEntryModal.classList.remove('hidden');
    pinEntryInput.focus();

    pinEntryForm.onsubmit = (e) => {
        e.preventDefault();
        const pin = pinEntryInput.value;
        fetch(`/verify-pin/${profile.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                selectProfile(profile.username, profile.helmetColor);
            } else {
                showMessage(data.message, false);
            }
        });
    };
};

const hidePinEntryModal = () => {
    pinEntryModal.classList.add('hidden');
};

cancelPinEntryBtn.addEventListener('click', () => {
    hidePinEntryModal();
});

// --- PIN Settings Modal Logic ---
const showPinSettingsModal = (profile) => {
    pinSettingsHeading.textContent = `PIN Settings for ${profile.username}`;
    editEnablePinCheckbox.checked = profile.pinEnabled;
    editPinInput.disabled = !profile.pinEnabled;
    editPinInput.value = profile.pin || '';

    pinSettingsModal.classList.remove('hidden');

    pinSettingsForm.onsubmit = (e) => {
        e.preventDefault();
        const pinEnabled = editEnablePinCheckbox.checked;
        const pin = editPinInput.value;

        if (pinEnabled && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
            showMessage('New PIN must be 4 digits.', false);
            return;
        }

        updateProfile(profile.id, { pinEnabled, pin });
        hidePinSettingsModal();
    };
};

const hidePinSettingsModal = () => {
    pinSettingsModal.classList.add('hidden');
};

editEnablePinCheckbox.addEventListener('change', () => {
    editPinInput.disabled = !editEnablePinCheckbox.checked;
    if (!editEnablePinCheckbox.checked) {
        editPinInput.value = '';
    }
});

cancelPinSettingsBtn.addEventListener('click', () => {
    hidePinSettingsModal();
});


// --- Central Profile Check Function ---
const checkProfiles = () => {
    return fetch('/check-profiles')
        .then(response => response.json())
        .then(data => {
            if (data.profiles && data.profiles.length > 0) {
                showSelectProfileModal(data.profiles);
            } else {
                hideSelectProfileModal();
                showProfileModal();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred while checking profiles.', false);
        });
};


// --- 'Get Ready' Button Logic ---
readyButton.addEventListener('click', () => {
    console.log("Click Event: 'Get Ready' button clicked. Checking for profiles...");
    readyButton.disabled = true;
    readyButton.textContent = 'Checking...';

    fetch('/check-profiles')
    .then(response => response.json())
    .then(data => {
        if (data.profiles_exist) {
            console.log("Profiles exist. Showing selection modal.");
            showSelectProfileModal(data.profiles);
        } else {
            console.log("No profiles found. Showing create profile modal.");
            showProfileModal();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred.', false);
    })
    .finally(() => {
        readyButton.disabled = false;
        readyButton.textContent = 'Click to get ready!';
    });
});
