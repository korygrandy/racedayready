// --- Global State ---
let currentUser = null;
let isDevModeEnabled = false; // Tracks if developer mode is active

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
const raceDayPrepView = document.getElementById('race-day-prep-view');
const backToFeaturesBtn = document.getElementById('back-to-features-btn');
const featureCard1 = document.getElementById('feature-card-1');
const featureCard7 = document.getElementById('feature-card-7');
const upcomingFeaturesView = document.getElementById('upcoming-features-view');
const backToFeaturesFromUpcomingBtn = document.getElementById('back-to-features-from-upcoming-btn');
const featureRequestForm = document.getElementById('feature-request-form');
const featureRequestTextarea = document.getElementById('feature-request-textarea');
const submitFeatureRequestBtn = document.getElementById('submit-feature-request-btn');
const charCounter = document.getElementById('char-counter');
const featureRequestList = document.getElementById('feature-request-list');

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

const devPinEntryModal = document.getElementById('dev-pin-entry-modal');
const devPinEntryForm = document.getElementById('dev-pin-entry-form');
const devPinEntryInput = document.getElementById('dev-pin-entry-input');
const cancelDevPinBtn = document.getElementById('cancel-dev-pin-btn');
const submitDevPinBtn = document.getElementById('submit-dev-pin-btn');

const pinSettingsModal = document.getElementById('pin-settings-modal');
const pinSettingsHeading = document.getElementById('pin-settings-heading');
const pinSettingsForm = document.getElementById('pin-settings-form');
const editEnablePinCheckbox = document.getElementById('edit-enable-pin-checkbox');
const editPinInput = document.getElementById('edit-pin-input');
const cancelPinSettingsBtn = document.getElementById('cancel-pin-settings-btn');
const savePinSettingsBtn = document.getElementById('save-pin-settings-btn');

// Admin elements
const profileLimitInput = document.getElementById('profile-limit-input');
const updateProfileLimitBtn = document.getElementById('update-profile-limit-btn');
const featureRequestLimitInput = document.getElementById('feature-request-limit-input');
const enableDeletionCheckbox = document.getElementById('enable-deletion-checkbox');
const updateFeatureSettingsBtn = document.getElementById('update-feature-settings-btn');
const manageFeatureRequestsLink = document.getElementById('manage-feature-requests-link');


// --- View Toggling Logic ---
const setView = (viewName) => {
    console.log(`Setting view to: ${viewName}`);
    mainView.classList.add('hidden');
    developerView.classList.add('hidden');
    featuresView.classList.add('hidden');
    raceDayPrepView.classList.add('hidden');
    upcomingFeaturesView.classList.add('hidden');

    const isDevMode = viewName === 'developer';
    devModeBtn.classList.toggle('hidden', isDevMode);

    if (isDevMode) {
        developerView.classList.remove('hidden');
        loadAdminSettings();
    } else if (viewName === 'features') {
        featuresView.classList.remove('hidden');
    } else if (viewName === 'raceDayPrep') {
        raceDayPrepView.classList.remove('hidden');
    } else if (viewName === 'upcomingFeatures') {
        upcomingFeaturesView.classList.remove('hidden');
        loadFeatureRequests();
    } else {
        mainView.classList.remove('hidden');
    }
};

devModeBtn.addEventListener('click', () => {
    console.log("Click Event: 'Developer Mode' button clicked. Showing PIN modal.");
    devPinEntryModal.classList.remove('hidden');
    devPinEntryInput.focus();
});

backToAppBtn.addEventListener('click', () => {
    console.log("Click Event: 'Back to App' button clicked.");
    isDevModeEnabled = false;
    setView('main');
});

profileHeaderBtn.addEventListener('click', () => {
    console.log("Click Event: 'Profile Header' button clicked.");
    setView('main');
    checkProfiles();
});

featureCard1.addEventListener('click', () => {
    console.log("Click Event: 'Race Day Prep' card clicked.");
    setView('raceDayPrep');
});

featureCard7.addEventListener('click', () => {
    console.log("Click Event: 'Upcoming Features' card clicked.");
    setView('upcomingFeatures');
});

backToFeaturesBtn.addEventListener('click', () => {
    console.log("Click Event: 'Back to Features' button clicked.");
    setView('features');
});

backToFeaturesFromUpcomingBtn.addEventListener('click', () => {
    console.log("Click Event: 'Back to Features' button clicked.");
    setView('features');
});

manageFeatureRequestsLink.addEventListener('click', () => {
    console.log("Click Event: 'Manage Requests' link clicked.");
    setView('upcomingFeatures');
});


// --- Message Box Logic ---
const showMessage = (message, isSuccess) => {
    console.log(`Showing message: "${message}", Success: ${isSuccess}`);
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
    console.log("Showing create profile modal.");
    hideSelectProfileModal();
    profileForm.reset();
    pinInput.disabled = true;
    profileModal.classList.remove('hidden');
};

const hideProfileModal = () => {
    console.log("Hiding create profile modal.");
    profileModal.classList.add('hidden');
};

enablePinCheckbox.addEventListener('change', (e) => {
    pinInput.disabled = !e.target.checked;
    console.log(`PIN input enabled state changed to: ${!pinInput.disabled}`);
    if (!e.target.checked) {
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

    if (!username) {
        showMessage('Username is required.', false);
        return;
    };
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
        console.error('Error creating profile:', error);
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
    checkProfiles();
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
    helmetPath.setAttribute('stroke', '#4A5568');
    helmetPath.setAttribute('stroke-width', '2');

    const visor = document.createElementNS(svgNS, 'rect');
    visor.setAttribute('x', '15');
    visor.setAttribute('y', '20');
    visor.setAttribute('width', '20');
    visor.setAttribute('height', '10');
    visor.setAttribute('fill', '#2D3748');
    visor.setAttribute('rx', '2');

    svg.appendChild(helmetPath);
    svg.appendChild(visor);

    return svg;
};


// --- Select Profile Modal Logic ---
const showSelectProfileModal = (profiles, limitReached) => {
    console.log(`Showing select profile modal. Profiles: ${profiles.length}, Limit Reached: ${limitReached}`);
    profileList.innerHTML = '';
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
            console.log(`Profile color changed for ${profile.username}`);
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
        nameInput.className = 'hidden flex-grow bg-gray-600 text-white rounded px-2 py-1';

        nameSpan.onclick = () => {
            nameSpan.classList.add('hidden');
            nameInput.classList.remove('hidden');
            nameInput.focus();
        };

        const saveEdit = () => {
            const newUsername = nameInput.value.trim();
            if (newUsername && newUsername !== profile.username) {
                console.log(`Profile username updated for ${profile.id}`);
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
            if (profile.pinEnabled) {
                showPinEntryForDelete(profile);
            } else {
                showDeleteConfirmModal(profile.id, profile.username);
            }
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

    if (limitReached) {
        addNewProfileBtn.disabled = true;
        addNewProfileBtn.textContent = 'Profile Limit Reached';
        addNewProfileBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        addNewProfileBtn.disabled = false;
        addNewProfileBtn.textContent = 'Add New Profile';
        addNewProfileBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    selectProfileModal.classList.remove('hidden');
};

const hideSelectProfileModal = () => {
    console.log("Hiding select profile modal.");
    selectProfileModal.classList.add('hidden');
};

const selectProfile = (username, helmetColor) => {
    currentUser = { username, helmetColor };
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
            featuresHelmetDisplay.innerHTML = '';
            featuresHelmetDisplay.appendChild(createHelmetIcon(helmetColor, 'w-12 h-12'));
            setView('features');
        }
    })
    .catch(error => {
        console.error('Error selecting profile:', error);
        showMessage('An error occurred while selecting the profile.', false);
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
            checkProfiles();
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showMessage('Failed to update profile.', false);
    });
};

addNewProfileBtn.addEventListener('click', () => {
    console.log("Click Event: 'Add New Profile' button clicked.");
    showProfileModal();
});

// --- Delete Confirmation Modal Logic ---
const showDeleteConfirmModal = (profileId, username) => {
    console.log(`Showing delete confirmation for profile: ${username}`);
    deleteConfirmText.textContent = `Are you sure you want to delete the profile for "${username}"? This action cannot be undone.`;
    deleteConfirmModal.classList.remove('hidden');

    confirmDeleteBtn.onclick = () => {
        console.log(`Click Event: Confirmed deletion for profile '${username}'.`);
        executeDelete(profileId);
    };
};

const hideDeleteConfirmModal = () => {
    console.log("Hiding delete confirmation modal.");
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
            hidePinEntryModal();
            checkProfiles();
        }
    })
    .catch(error => {
        console.error('Error deleting profile:', error);
        showMessage('Failed to delete profile.', false);
    });
};

// --- PIN Entry Modal Logic ---
const showPinEntryModal = (profile, forDelete = false) => {
    console.log(`Showing PIN entry modal for ${profile.username}. For delete: ${forDelete}`);
    pinEntryText.textContent = forDelete ? `Enter PIN to delete ${profile.username}` : `Enter PIN for ${profile.username}`;
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
                if (forDelete) {
                    executeDelete(profile.id);
                } else {
                    selectProfile(profile.username, profile.helmetColor);
                }
            } else {
                showMessage(data.message, false);
            }
        });
    };
};

const showPinEntryForDelete = (profile) => {
    showPinEntryModal(profile, true);
};

const hidePinEntryModal = () => {
    console.log("Hiding PIN entry modal.");
    pinEntryModal.classList.add('hidden');
};

cancelPinEntryBtn.addEventListener('click', () => {
    hidePinEntryModal();
});


// --- Developer PIN Modal Logic ---
devPinEntryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = devPinEntryInput.value;
    console.log(`Dev PIN submitted: ${enteredPin}`);

    if (enteredPin === '3511') {
        console.log("Dev PIN validation successful.");
        showMessage('Access Granted.', true);
        devPinEntryModal.classList.add('hidden');
        devPinEntryInput.value = '';
        isDevModeEnabled = true;
        setView('developer');
    } else {
        console.error("Dev PIN validation failed.");
        showMessage('Incorrect PIN. Access Denied.', false);
        devPinEntryInput.value = '';
    }
});

cancelDevPinBtn.addEventListener('click', () => {
    devPinEntryModal.classList.add('hidden');
    devPinEntryInput.value = '';
    console.log("Dev PIN entry canceled.");
});


// --- PIN Settings Modal Logic ---
const showPinSettingsModal = (profile) => {
    console.log(`Showing PIN settings modal for ${profile.username}`);
    pinSettingsHeading.textContent = `PIN Settings for ${profile.username}`;
    editEnablePinCheckbox.checked = profile.pinEnabled;
    editPinInput.disabled = !profile.pinEnabled;
    editPinInput.value = ''; // Always clear for security

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
    console.log("Hiding PIN settings modal.");
    pinSettingsModal.classList.add('hidden');
};

editEnablePinCheckbox.addEventListener('change', (e) => {
    editPinInput.disabled = !e.target.checked;
    if (!e.target.checked) {
        editPinInput.value = '';
    }
});

cancelPinSettingsBtn.addEventListener('click', () => {
    hidePinSettingsModal();
});


// --- Central Profile Check Function ---
const checkProfiles = () => {
    console.log("Checking for existing profiles...");
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
            console.error('Error checking profiles:', error);
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
            showSelectProfileModal(data.profiles, data.limit_reached);
        } else {
            console.log("No profiles found. Showing create profile modal.");
            showProfileModal();
        }
    })
    .catch(error => {
        console.error('Error on Get Ready:', error);
        showMessage('An error occurred.', false);
    })
    .finally(() => {
        readyButton.disabled = false;
        readyButton.textContent = 'Click to get ready!';
    });
});

// --- Feature Request Logic ---

const deleteFeatureRequest = (requestId) => {
    console.log(`Initiating deletion for feature request ID: ${requestId}`);
    if (!confirm('Are you sure you want to permanently delete this feature request?')) {
        console.log("Feature request deletion canceled by user.");
        return;
    }

    fetch(`/delete-feature-request/${requestId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            loadFeatureRequests();
        }
    })
    .catch(error => {
        console.error('Error deleting feature request:', error);
        showMessage('Failed to delete request.', false);
    });
};

const loadFeatureRequests = () => {
    console.log("Loading feature requests...");
    fetch('/get-feature-requests')
        .then(response => response.json())
        .then(data => {
            featureRequestList.innerHTML = '';
            if (data.success) {
                // Handle submission form state
                if (data.limit_reached) {
                    featureRequestTextarea.disabled = true;
                    submitFeatureRequestBtn.disabled = true;
                    submitFeatureRequestBtn.textContent = 'Request Limit Reached';
                    featureRequestTextarea.placeholder = 'The maximum number of feature requests has been submitted.';
                } else {
                    featureRequestTextarea.disabled = false;
                    submitFeatureRequestBtn.disabled = false;
                    submitFeatureRequestBtn.textContent = 'Submit Request';
                    featureRequestTextarea.placeholder = 'Describe your feature idea...';
                }
                
                // Render list
                if (data.requests.length > 0) {
                    data.requests.forEach(req => {
                        const reqElement = document.createElement('div');
                        reqElement.className = 'bg-gray-700 p-4 rounded-lg flex justify-between items-start';

                        const textContainer = document.createElement('div');
                        textContainer.innerHTML = `<p class="text-gray-300">${req.requestText}</p><p class="text-sm text-gray-500 mt-2">- ${req.username}</p>`;
                        reqElement.appendChild(textContainer);

                        if (isDevModeEnabled && data.deletion_enabled) {
                            const deleteButton = document.createElement('button');
                            deleteButton.innerHTML = '&times;';
                            deleteButton.className = 'ml-4 text-red-500 hover:text-red-400 font-bold text-2xl px-2 leading-none';
                            deleteButton.title = 'Delete Request';
                            deleteButton.onclick = () => deleteFeatureRequest(req.id);
                            reqElement.appendChild(deleteButton);
                        }
                        
                        featureRequestList.appendChild(reqElement);
                    });
                } else {
                    featureRequestList.innerHTML = '<p class="text-gray-500">No feature requests submitted yet.</p>';
                }
            }
        });
};

featureRequestTextarea.addEventListener('input', () => {
    const currentLength = featureRequestTextarea.value.length;
    charCounter.textContent = `${currentLength} / 500`;
});

featureRequestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Click Event: 'Submit Feature Request' button clicked.");
    const requestText = featureRequestTextarea.value.trim();
    if (!requestText || !currentUser) {
        showMessage('Cannot submit an empty request.', false);
        return;
    }

    submitFeatureRequestBtn.disabled = true;
    submitFeatureRequestBtn.textContent = 'Submitting...';

    fetch('/submit-feature-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, requestText: requestText }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            featureRequestTextarea.value = '';
            charCounter.textContent = '0 / 500';
            loadFeatureRequests();
        }
    })
    .catch(error => {
        console.error('Error submitting feature request:', error);
        showMessage('Failed to submit request.', false);
    })
    .finally(() => {
        // The button's state will be correctly set by the next loadFeatureRequests() call
    });
});

// --- Admin Settings Logic ---
const loadAdminSettings = () => {
    console.log("Loading admin settings...");
    fetch('/get-admin-settings')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                profileLimitInput.value = data.profile_limit;
                featureRequestLimitInput.value = data.feature_request_settings.limit;
                enableDeletionCheckbox.checked = data.feature_request_settings.deletion_enabled;
            }
        });
};

updateProfileLimitBtn.addEventListener('click', () => {
    console.log("Click Event: 'Update Profile Limit' button clicked.");
    const newLimit = profileLimitInput.value;
    fetch('/update-profile-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: newLimit }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
    });
});

updateFeatureSettingsBtn.addEventListener('click', () => {
    console.log("Click Event: 'Update Feature Settings' button clicked.");
    const newLimit = featureRequestLimitInput.value;
    const deletionEnabled = enableDeletionCheckbox.checked;
    fetch('/update-feature-request-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: newLimit, deletion_enabled: deletionEnabled }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
    });
});