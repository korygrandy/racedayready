import * as elements from './elements.js';
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
                elements.profileLimitInput.value = data.profile_limit;
                elements.garageLimitInput.value = data.garage_limit;
                elements.vehicleLimitInput.value = data.vehicle_limit;
                elements.featureRequestLimitInput.value = data.feature_request_settings.limit;
                elements.enableDeletionCheckbox.checked = data.feature_request_settings.deletion_enabled;
            }
        });
};

/**
 * Initializes all event listeners for the admin panel.
 */
export const initAdmin = () => {
    elements.updateProfileLimitBtn.addEventListener('click', () => {
        console.log("Click Event: 'Update Profile Limit' button clicked.");
        const newLimit = elements.profileLimitInput.value;
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

    elements.updateGarageVehicleLimitsBtn.addEventListener('click', () => {
        console.log("Click Event: 'Update Garage & Vehicle Limits' button clicked.");
        const garageLimit = elements.garageLimitInput.value;
        const vehicleLimit = elements.vehicleLimitInput.value;

        // Create two separate promises to update both limits
        const garagePromise = fetch('/update-garage-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: garageLimit }),
        }).then(res => res.json());

        const vehiclePromise = fetch('/update-vehicle-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: vehicleLimit }),
        }).then(res => res.json());

        // Wait for both to complete
        Promise.all([garagePromise, vehiclePromise]).then(results => {
            const garageResult = results[0];
            const vehicleResult = results[1];
            if (garageResult.success && vehicleResult.success) {
                showMessage("Garage and vehicle limits updated successfully.", true);
            } else {
                showMessage("One or more limits failed to update.", false);
            }
        });
    });

    elements.updateFeatureSettingsBtn.addEventListener('click', () => {
        console.log("Click Event: 'Update Feature Settings' button clicked.");
        const newLimit = elements.featureRequestLimitInput.value;
        const deletionEnabled = elements.enableDeletionCheckbox.checked;
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

    elements.manageFeatureRequestsLink.addEventListener('click', () => {
        console.log("Click Event: 'Manage Requests' link clicked.");
        App.setView('upcomingFeatures');
    });

    // Expose loadAdminSettings to the global App object for external calls if needed
    App.loadAdminSettings = loadAdminSettings;
};