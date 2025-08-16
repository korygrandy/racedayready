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
                elements.enableGarageDeletionCheckbox.checked = data.garage_settings.deletion_enabled;
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
    // Use event delegation on the developerView container
    elements.developerView.addEventListener('click', (e) => {
        const target = e.target.closest('button, a');
        if (!target) return;

        switch (target.id) {
            case 'update-profile-limit-btn': {
                const limit = parseInt(elements.profileLimitInput.value, 10);
                updateSettings('/update-profile-limit', { limit });
                break;
            }
            case 'update-garage-vehicle-limits-btn': {
                const garageLimit = parseInt(elements.garageLimitInput.value, 10);
                const vehicleLimit = parseInt(elements.vehicleLimitInput.value, 10);
                updateSettings('/update-garage-limit', { limit: garageLimit });
                updateSettings('/update-vehicle-limit', { limit: vehicleLimit });
                break;
            }
            case 'update-feature-settings-btn': {
                const limit = parseInt(elements.featureRequestLimitInput.value, 10);
                const deletion_enabled = elements.enableDeletionCheckbox.checked;
                updateSettings('/update-feature-request-settings', { limit, deletion_enabled });
                break;
            }
            case 'update-lap-time-settings-btn': {
                const deletion_enabled = elements.enableLapTimeDeletionCheckbox.checked;
                updateSettings('/update-lap-time-settings', { deletion_enabled });
                break;
            }
            case 'update-garage-settings-btn': {
                const deletion_enabled = elements.enableGarageDeletionCheckbox.checked;
                updateSettings('/update-garage-settings', { deletion_enabled });
                break;
            }
            case 'update-app-settings-btn': {
                const maintenance_enabled = elements.maintenanceModeCheckbox.checked;
                updateSettings('/update-maintenance-mode', { enabled: maintenance_enabled });
                break;
            }
            case 'manage-feature-requests-link':
                e.preventDefault();
                App.setView('upcomingFeatures');
                break;
            case 'go-to-winners-circle-link':
                e.preventDefault();
                App.setView('lapTime');
                break;
            case 'seed-database-btn':
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
                            if (data.success) window.location.reload();
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
                break;
            case 'clear-all-data-btn':
                showConfirmationModal(
                    "DANGER: Are you absolutely sure you want to clear all data? This will permanently delete all user-generated content from the database. This action cannot be undone.",
                    () => {
                        elements.clearAllDataBtn.disabled = true;
                        elements.clearAllDataBtn.textContent = 'Clearing...';
                        fetch('/clear-all-data', { method: 'DELETE' })
                        .then(res => res.json())
                        .then(data => {
                            showMessage(data.message, data.success);
                            if (data.success) window.location.reload();
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
                break;
            case 'view-use-cases-link': {
                e.preventDefault();
                const container = elements.useCasesContainer;
                if (container.classList.contains('hidden')) {
                    fetch('/static/usecases.json')
                        .then(res => res.json())
                        .then(data => {
                            container.innerHTML = '';
                            data.forEach(useCase => {
                                const card = document.createElement('div');
                                card.className = 'bg-input p-3 rounded-lg';
                                const notesList = useCase.use_cases.map(note => `<li>${note}</li>`).join('');
                                card.innerHTML = `
                                    <h4 class="font-bold text-text-primary">${useCase.username}</h4>
                                    <p class="text-sm text-text-secondary italic mb-2">${useCase.description}</p>
                                    <ul class="list-disc list-inside text-sm space-y-1">${notesList}</ul>
                                `;
                                container.appendChild(card);
                            });
                            container.classList.remove('hidden');
                        })
                        .catch(error => console.error('[ERROR] Could not load use cases:', error));
                } else {
                    container.classList.add('hidden');
                }
                break;
            }
        }
    });

    App.loadAdminSettings = loadAdminSettings;
};
