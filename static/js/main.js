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
    dev_mode: false, // Toggle for using mock data
    cache: {
        tracks: null,
        vehicles: null,
    },
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

const playRacecarSound = () => {
    const audio = new Audio('/static/fx/racecar.mp3');
    audio.play().catch(error => console.error("Audio playback failed:", error));
};

const injectFeatureCardIcons = () => {
    const icons = {
        'feature-card-icon-1': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" /></svg>`,
        'feature-card-icon-2': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 003.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>`,
        'feature-card-icon-6': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" /></svg>`,
        'feature-card-icon-9': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-8.25v8.25m-6-4.5h6m-6 4.5h6m-6-8.25H7.5a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25H15M3 12h18" /></svg>`,
        'feature-card-icon-8': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.036-4.825 9.75 9.75 0 019.714 0A9.75 9.75 0 0116.5 18.75z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75a4.125 4.125 0 110-8.25 4.125 4.125 0 010 8.25zM12 12.75v6.75" /></svg>`,
        'feature-card-icon-7': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`
    };
    for (const id in icons) {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = icons[id];
        }
    }
};

// --- Main Event Listeners ---
const initEventListeners = () => {
    if (elements.readyButton) {
        elements.readyButton.addEventListener('click', () => {
            playRacecarSound();
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
            elements.readyButton.textContent = 'Get Ready!';
        });
    }

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
    injectFeatureCardIcons();
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
