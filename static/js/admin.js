import {
    profileLimitInput,
    updateProfileLimitBtn,
    featureRequestLimitInput,
    enableDeletionCheckbox,
    updateFeatureSettingsBtn,
    manageFeatureRequestsLink
} from './elements.js';
import { showMessage } from './ui.js';
import { App } from './main.js';

/**
 * Loads all administrative settings from the backend.
 */
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

/**
 * Initializes all event listeners for the admin panel.
 */
export const initAdmin = () => {
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

    manageFeatureRequestsLink.addEventListener('click', () => {
        console.log("Click Event: 'Manage Requests' link clicked.");
        App.setView('upcomingFeatures');
    });

    // Expose loadAdminSettings to the global App object for external calls if needed
    App.loadAdminSettings = loadAdminSettings;
};