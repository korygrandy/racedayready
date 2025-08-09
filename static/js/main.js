import * as elements from './elements.js';
import { showMessage } from './ui.js';
import { initTheme } from './theme.js';
import { initProfiles, checkProfiles, updateProfile } from './profile.js';
import { initFeatures, loadFeatureRequests } from './features.js';
import { initAdmin } from './admin.js';
import { initGarage } from './garage.js'; // NEW

// --- Global App Object ---
export const App = {
    currentUser: null,
    isDevModeEnabled: false,
    setView: null,
    updateProfile: updateProfile,
    loadAdminSettings: null,
    loadGarages: null, // NEW
};

// --- View Toggling Logic ---
const setView = (viewName) => {
    console.log(`Setting view to: ${viewName}`);
    elements.mainView.classList.add('hidden');
    elements.developerView.classList.add('hidden');
    elements.featuresView.classList.add('hidden');
    elements.raceDayPrepView.classList.add('hidden');
    elements.upcomingFeaturesView.classList.add('hidden');
    elements.garageManagementView.classList.add('hidden'); // NEW

    const isDevMode = viewName === 'developer';
    elements.devModeBtn.classList.toggle('hidden', isDevMode);

    if (isDevMode) {
        elements.developerView.classList.remove('hidden');
        if (App.loadAdminSettings) App.loadAdminSettings();
    } else if (viewName === 'features') {
        elements.featuresView.classList.remove('hidden');
    } else if (viewName === 'raceDayPrep') {
        elements.raceDayPrepView.classList.remove('hidden');
    } else if (viewName === 'upcomingFeatures') {
        elements.upcomingFeaturesView.classList.remove('hidden');
        loadFeatureRequests();
    } else if (viewName === 'garageManagement') { // NEW
        elements.garageManagementView.classList.remove('hidden');
        if (App.loadGarages) App.loadGarages();
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

    elements.featureCard6.addEventListener('click', () => { // NEW
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
    initGarage(); // NEW
});