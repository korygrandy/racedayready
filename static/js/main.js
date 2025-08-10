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

// --- Global App Object ---
export const App = {
    currentUser: null,
    isDevModeEnabled: false,
    setView: null,
    updateProfile: updateProfile,
    loadAdminSettings: null,
    loadGarages: null,
    loadVehicles: null,
    loadEvents: null,
    loadChecklists: null,
};

// --- View Toggling Logic ---
const setView = (viewName) => {
    console.log(`Setting view to: ${viewName}`);
    elements.mainView.classList.add('hidden');
    elements.developerView.classList.add('hidden');
    elements.featuresView.classList.add('hidden');
    elements.raceDayPrepView.classList.add('hidden');
    elements.upcomingFeaturesView.classList.add('hidden');
    elements.garageManagementView.classList.add('hidden');
    elements.vehicleManagementView.classList.add('hidden');
    elements.raceScheduleView.classList.add('hidden');
    elements.checklistManagementView.classList.add('hidden');
    elements.profileHeaderBtn.classList.add('hidden'); // Hide by default

    const isDevMode = viewName === 'developer';
    elements.devModeBtn.classList.toggle('hidden', isDevMode);

    // Show/hide global elements
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
    } else {
        elements.mainView.classList.remove('hidden');
    }
};
App.setView = setView;

// --- Developer PIN Modal Logic ---
const initDevPinModal = () => {
    elements.devPinEntryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPin = elements.devPinEntryInput.value;
        console.log(`Dev PIN submitted: ${enteredPin}`);

        if (enteredPin === '3511') {
            console.log("Dev PIN validation successful.");
            showMessage('Access Granted.', true);
            elements.devPinEntryModal.classList.add('hidden');
            elements.devPinEntryInput.value = '';
            App.isDevModeEnabled = true;
            setView('developer');
        } else {
            console.error("Dev PIN validation failed.");
            showMessage('Incorrect PIN. Access Denied.', false);
            elements.devPinEntryInput.value = '';
        }
    });

    elements.cancelDevPinBtn.addEventListener('click', () => {
        elements.devPinEntryModal.classList.add('hidden');
        elements.devPinEntryInput.value = '';
        console.log("Dev PIN entry canceled.");
    });
};

// --- Main Event Listeners ---
const initEventListeners = () => {
    elements.readyButton.addEventListener('click', () => {
        console.log("Click Event: 'Get Ready' button clicked. Checking for profiles...");
        elements.readyButton.disabled = true;
        elements.readyButton.textContent = 'Checking...';

        fetch('/get-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        fetch('/check-profiles')
        .then(response => response.json())
        .then(data => {
            if (data.profiles_exist) {
                checkProfiles();
            } else {
                checkProfiles();
            }
        })
        .catch(error => {
            console.error('Error on Get Ready:', error);
            showMessage('An error occurred.', false);
        })
        .finally(() => {
            elements.readyButton.disabled = false;
            elements.readyButton.textContent = 'Click to get ready!';
        });
    });

    elements.devModeBtn.addEventListener('click', () => {
        console.log("Click Event: 'Developer Mode' button clicked. Showing PIN modal.");
        elements.devPinEntryModal.classList.remove('hidden');
        elements.devPinEntryInput.focus();
    });

    elements.backToAppBtn.addEventListener('click', () => {
        console.log("Click Event: 'Back to App' button clicked.");
        App.isDevModeEnabled = false;
        setView('main');
    });

    elements.profileHeaderBtn.addEventListener('click', () => {
        console.log("Click Event: 'Profile Header' button clicked.");
        setView('main');
        checkProfiles();
    });

    elements.featureCard1.addEventListener('click', () => {
        console.log("Click Event: 'Race Day Prep' card clicked.");
        setView('raceDayPrep');
    });

    elements.raceScheduleCard.addEventListener('click', () => {
        console.log("Click Event: 'Race Schedule' card clicked.");
        setView('raceSchedule');
    });

    elements.checklistTemplatesCard.addEventListener('click', () => {
        console.log("Click Event: 'Checklist Templates' card clicked.");
        setView('checklistManagement');
    });

    elements.featureCard2.addEventListener('click', () => {
        console.log("Click Event: 'Vehicle Management' card clicked.");
        setView('vehicleManagement');
    });

    elements.featureCard6.addEventListener('click', () => {
        console.log("Click Event: 'Garage Management' card clicked.");
        setView('garageManagement');
    });

    elements.featureCard7.addEventListener('click', () => {
        console.log("Click Event: 'Upcoming Features' card clicked.");
        setView('upcomingFeatures');
    });

    document.querySelectorAll('.inactive-card').forEach(card => {
        card.addEventListener('click', () => {
            console.log(`Click Event: Inactive card clicked. ID: ${card.id}`);
            showMessage('This feature is coming soon!', true);
        });
    });

    elements.backToFeaturesBtn.addEventListener('click', () => {
        console.log("Click Event: 'Back to Features' button clicked.");
        setView('features');
    });

    elements.backToFeaturesFromUpcomingBtn.addEventListener('click', () => {
        console.log("Click Event: 'Back to Features' button clicked.");
        setView('features');
    });
};

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing application.");
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
});