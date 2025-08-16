import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';
import { MOCK_USERS, MOCK_TRACKS } from './mock-data.js';

const loadAdminSettings = () => {
    console.log("[INFO] Loading admin settings...");
    fetch('/get-admin-settings')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                elements.profileLimitInput.value = data.profile_limit;
                elements.garageLimitInput.value = data.garage_limit;
                elements.vehicleLimitInput.value = data.vehicle_limit;
                elements.featureRequestLimitInput.value = data.feature_request_settings.limit;
                elements.enableDeletionCheckbox.checked = data.feature_request_settings.deletion_enabled;
                elements.enableLapTimeDeletionCheckbox.checked = data.lap_time_settings.deletion_enabled;
                elements.maintenanceModeCheckbox.checked = data.maintenance_settings.enabled;
            } else {
                showMessage("Failed to load admin settings.", false);
            }
        })
        .catch(error => console.error('[ERROR] Failed to fetch admin settings:', error));
};

const updateSettings = (url, payload) => {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => showMessage(data.message, data.success))
    .catch(error => {
        console.error(`[ERROR] Failed to update settings at ${url}:`, error);
        showMessage('Failed to update settings.', false);
    });
};

export const initAdmin = () => {
    elements.updateProfileLimitBtn.addEventListener('click', () => {
        const limit = parseInt(elements.profileLimitInput.value, 10);
        updateSettings('/update-profile-limit', { limit });
    });

    elements.updateGarageVehicleLimitsBtn.addEventListener('click', () => {
        const garageLimit = parseInt(elements.garageLimitInput.value, 10);
        const vehicleLimit = parseInt(elements.vehicleLimitInput.value, 10);
        updateSettings('/update-garage-limit', { limit: garageLimit });
        updateSettings('/update-vehicle-limit', { limit: vehicleLimit });
    });

    elements.updateFeatureSettingsBtn.addEventListener('click', () => {
        const limit = parseInt(elements.featureRequestLimitInput.value, 10);
        const deletion_enabled = elements.enableDeletionCheckbox.checked;
        updateSettings('/update-feature-request-settings', { limit, deletion_enabled });
    });

    elements.updateLapTimeSettingsBtn.addEventListener('click', () => {
        const deletion_enabled = elements.enableLapTimeDeletionCheckbox.checked;
        updateSettings('/update-lap-time-settings', { deletion_enabled });
    });

    elements.updateAppSettingsBtn.addEventListener('click', () => {
        const maintenance_enabled = elements.maintenanceModeCheckbox.checked;
        updateSettings('/update-maintenance-mode', { enabled: maintenance_enabled });
    });

    elements.manageFeatureRequestsLink.addEventListener('click', (e) => {
        e.preventDefault();
        App.setView('upcomingFeatures');
    });

    elements.goToWinnersCircleLink.addEventListener('click', (e) => {
        e.preventDefault();
        App.setView('lapTime');
    });

    elements.seedDatabaseBtn.addEventListener('click', () => {
        showConfirmationModal(
            "Are you sure you want to seed the database with sample data? This may overwrite existing data with the same names.",
            () => {
                elements.seedDatabaseBtn.disabled = true;
                elements.seedDatabaseBtn.textContent = 'Seeding...';
                fetch('/seed-database', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ users: MOCK_USERS, tracks: MOCK_TRACKS }),
                })
                .then(res => res.json())
                .then(data => {
                    showMessage(data.message, data.success);
                    if (data.success) {
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error('[ERROR] Error seeding database:', error);
                    showMessage('Failed to seed database.', false);
                })
                .finally(() => {
                    elements.seedDatabaseBtn.disabled = false;
                    elements.seedDatabaseBtn.textContent = 'Seed Database';
                });
            }
        );
    });

    elements.clearAllDataBtn.addEventListener('click', () => {
        showConfirmationModal(
            "DANGER: Are you absolutely sure you want to clear all data? This will permanently delete all user-generated content from the database. This action cannot be undone.",
            () => {
                elements.clearAllDataBtn.disabled = true;
                elements.clearAllDataBtn.textContent = 'Clearing...';
                fetch('/clear-all-data', {
                    method: 'DELETE',
                })
                .then(res => res.json())
                .then(data => {
                    showMessage(data.message, data.success);
                    if (data.success) {
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error('[ERROR] Error clearing all data:', error);
                    showMessage('Failed to clear data.', false);
                })
                .finally(() => {
                    elements.clearAllDataBtn.disabled = false;
                    elements.clearAllDataBtn.textContent = 'Clear All Data';
                });
            }
        );
    });

    App.loadAdminSettings = loadAdminSettings;
};
