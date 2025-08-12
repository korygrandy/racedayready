import * as elements from './elements.js';
import { showMessage } from './ui.js';
import { initTheme } from './theme.js';
import { initProfiles, checkProfiles, updateProfile, checkProfileStatus } from './profile.js';
import { initFeatures, loadFeatureRequests } from './features.js';
import { initAdmin } from './admin.js';
import { initGarage } from './garage.js';
import { initVehicle } from './vehicle.js';
import { initSchedule, updateRacedayCountdown } from './schedule.js';
import { initChecklists } from './checklist.js';
import { initLapTimes } from './laptimes.js';
import { initTrack } from './track.js';

// --- Global App Object ---
export const App = {
    currentUser: null,
    isDevModeEnabled: false,
    defaultTheme: 'dark',
    setView: null,
    updateProfile: updateProfile,
    loadAdminSettings: null,
    loadGarages: null,
    loadVehicles: null,
    loadEvents: null,
    loadChecklists: null,
    loadLapTimes: null,
    loadTracks: null,
};

// --- View Toggling Logic ---
const setView = (viewName) => {
    console.log(`[INFO] Setting view to: ${viewName}`);
    elements.mainView.classList.add('hidden');
    elements.developerView.classList.add('hidden');
    elements.featuresView.classList.add('hidden');
    elements.raceDayPrepView.classList.add('hidden');
    elements.upcomingFeaturesView.classList.add('hidden');
    elements.garageManagementView.classList.add('hidden');
    elements.vehicleManagementView.classList.add('hidden');
    elements.raceScheduleView.classList.add('hidden');
    elements.checklistManagementView.classList.add('hidden');
    elements.lapTimeView.classList.add('hidden');
    elements.trackManagementView.classList.add('hidden');
    elements.profileHeaderBtn.classList.add('hidden');

    const isDevMode = viewName === 'developer';
    elements.devModeBtn.classList.toggle('hidden', isDevMode);

    if (viewName !== 'main' && App.currentUser) {
        elements.profileHeaderBtn.classList.remove('hidden');
        elements.racedayCountdownContainer.classList.remove('hidden');
        updateRacedayCountdown();
    } else {
        elements.racedayCountdownContainer.classList.add('hidden');
    }

    if (isDevMode) {
        elements.developerView.classList.remove('hidden');
        if (App.loadAdminSettings) App.loadAdminSettings();
    } else if (viewName === 'features') {
        elements.featuresView.classList.remove('hidden');
        checkProfileStatus();
    } else if (viewName === 'raceDayPrep') {
        elements.raceDayPrepView.classList.remove('hidden');
    } else if (viewName === 'upcomingFeatures') {
        elements.upcomingFeaturesView.classList.remove('hidden');
        loadFeatureRequests();
    } else if (viewName === 'garageManagement') {
        elements.garageManagementView.classList.remove('hidden');
        if (App.loadGarages) App.loadGarages();
    } else if (viewName === 'vehicleManagement') {
        elements.vehicleManagementView.classList.remove('hidden');
        if (App.loadVehicles) App.loadVehicles();
    } else if (viewName === 'raceSchedule') {
        elements.raceScheduleView.classList.remove('hidden');
        if (App.loadEvents) App.loadEvents();
    } else if (viewName === 'checklistManagement') {
        elements.checklistManagementView.classList.remove('hidden');
        if (App.loadChecklists) App.loadChecklists();
    } else if (viewName === 'lapTime') {
        elements.lapTimeView.classList.remove('hidden');
        if (App.loadLapTimes) App.loadLapTimes();
    } else if (viewName === 'trackManagement') {
        elements.trackManagementView.classList.remove('hidden');
        if (App.loadTracks) App.loadTracks();
    } else {
        elements.mainView.classList.remove('hidden');
    }
};
App.setView = setView;

// --- Developer PIN Modal Logic ---
const initDevPinModal = () => {
    elements.devPinEntryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredPin = elements.devPinEntryInput.value;
        console.log(`[DEBUG] Dev PIN submitted: ${enteredPin}`);

        try {
            const response = await fetch('/get-admin-pin');
            const data = await response.json();

            if (data.success && enteredPin === data.pin) {
                console.log("[INFO] Dev PIN validation successful.");
                showMessage('Access Granted.', true);
                elements.devPinEntryModal.classList.add('hidden');
                elements.devPinEntryInput.value = '';
                App.isDevModeEnabled = true;
                setView('developer');
            } else {
                console.error("[ERROR] Dev PIN validation failed.");
                showMessage('Incorrect PIN. Access Denied.', false);
                elements.devPinEntryInput.value = '';
            }
        } catch (error) {
            console.error("[ERROR] Error fetching admin PIN:", error);
            showMessage("An error occurred while verifying the PIN.", false);
        }
    });

    elements.cancelDevPinBtn.addEventListener('click', () => {
        elements.devPinEntryModal.classList.add('hidden');
        elements.devPinEntryInput.value = '';
        console.log("[INFO] Dev PIN entry canceled.");
    });
};

// --- Main Event Listeners ---
const initEventListeners = () => {
    elements.readyButton.addEventListener('click', () => {
        console.log("[INFO] 'Get Ready' button clicked. Checking for profiles...");
        elements.readyButton.disabled = true;
        elements.readyButton.textContent = 'Checking...';

        fetch('/get-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        }).catch(error => console.error("[ERROR] Error on readiness check:", error));

        checkProfiles();

        elements.readyButton.disabled = false;
        elements.readyButton.textContent = 'Click to get ready!';
    });

    elements.devModeBtn.addEventListener('click', () => {
        if(document.getElementById('main-view').querySelector('h1').textContent.includes('Maintenance')) {
            showMessage("Enter PIN to manage maintenance mode.", true);
        }
        console.log("[INFO] 'Developer Mode' button clicked. Showing PIN modal.");
        elements.devPinEntryModal.classList.remove('hidden');
        elements.devPinEntryInput.focus();
    });

    elements.backToAppBtn.addEventListener('click', () => {
        console.log("[INFO] 'Back to App' button clicked.");
        App.isDevModeEnabled = false;
        window.location.reload();
    });

    elements.profileHeaderBtn.addEventListener('click', () => {
        console.log("[INFO] 'Profile Header' button clicked.");
        setView('main');
        checkProfiles();
    });

    elements.featureCard1.addEventListener('click', () => {
        console.log("[INFO] 'Race Day Prep' card clicked.");
        setView('raceDayPrep');
    });

    elements.raceScheduleCard.addEventListener('click', () => {
        console.log("[INFO] 'Race Schedule' card clicked.");
        setView('raceSchedule');
    });

    elements.checklistTemplatesCard.addEventListener('click', () => {
        console.log("[INFO] 'Checklist Templates' card clicked.");
        setView('checklistManagement');
    });

    elements.featureCard2.addEventListener('click', () => {
        console.log("[INFO] 'Vehicle Management' card clicked.");
        setView('vehicleManagement');
    });

    elements.featureCard6.addEventListener('click', () => {
        console.log("[INFO] 'Garage Management' card clicked.");
        setView('garageManagement');
    });

    elements.featureCard7.addEventListener('click', () => {
        console.log("[INFO] 'Upcoming Features' card clicked.");
        setView('upcomingFeatures');
    });

    elements.featureCard8.addEventListener('click', () => {
        console.log("[INFO] 'Winner's Circle' card clicked.");
        setView('lapTime');
    });

    elements.featureCard9.addEventListener('click', () => {
        console.log("[INFO] 'Track Management' card clicked.");
        setView('trackManagement');
    });

    document.querySelectorAll('.inactive-card').forEach(card => {
        card.addEventListener('click', () => {
            console.log(`[DEBUG] Inactive card clicked. ID: ${card.id}`);
            showMessage('This feature is coming soon!', true);
        });
    });

    elements.backToFeaturesBtn.addEventListener('click', () => {
        console.log("[INFO] 'Back to Features' button clicked.");
        setView('features');
    });

    elements.backToFeaturesFromUpcomingBtn.addEventListener('click', () => {
        console.log("[INFO] 'Back to Features' button clicked.");
        setView('features');
    });
};

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("[INFO] DOM fully loaded and parsed. Initializing application.");
    initEventListeners();
    initDevPinModal();
    initTheme();
    initProfiles();
    initFeatures();
    initAdmin();
    initGarage();
    initVehicle();
    initSchedule();
    initChecklists();
    initLapTimes();
    initTrack();
});
