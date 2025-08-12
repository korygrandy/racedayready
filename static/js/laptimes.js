import * as elements from './elements.js';
import { showMessage } from './ui.js';
import { App } from './main.js';

let allEvents = [];

const populateEventDropdown = () => {
    elements.lapTimeEventSelect.innerHTML = '<option value="">Select a Raceday Event</option>';
    const racedayEvents = allEvents.filter(event => event.is_raceday);

    if (racedayEvents.length > 0) {
        racedayEvents.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.name;
            elements.lapTimeEventSelect.appendChild(option);
        });
    } else {
        elements.lapTimeEventSelect.innerHTML = '<option value="">No Raceday events found</option>';
    }
};

const renderLapTimes = (lapTimes) => {
    elements.lapTimeList.innerHTML = '';
    if (lapTimes.length === 0) {
        elements.lapTimeList.innerHTML = '<p class="text-text-secondary">No lap times recorded for this event yet.</p>';
        return;
    }

    lapTimes.forEach((time, index) => {
        const rank = index + 1;
        let medal = '';
        if (rank === 1) medal = '🥇';
        else if (rank === 2) medal = '🥈';
        else if (rank === 3) medal = '🥉';

        const timeEl = document.createElement('div');
        timeEl.className = 'flex items-center justify-between bg-card-darker p-3 rounded-lg';
        timeEl.innerHTML = `
            <div class="flex items-center">
                <span class="text-xl font-bold w-8">${rank}${medal}</span>
                <span class="font-semibold">${time.username}</span>
            </div>
            <span class="font-mono text-lg">${time.lapTime}</span>
        `;
        elements.lapTimeList.appendChild(timeEl);
    });
};

const loadLapTimesForEvent = (eventId) => {
    if (!eventId) {
        elements.lapTimeList.innerHTML = '<p class="text-text-secondary">Select an event to see the winner\'s circle.</p>';
        return;
    }

    const selectedEvent = allEvents.find(e => e.id === eventId);
    elements.winnerCircleHeading.textContent = `Winner's Circle: ${selectedEvent.name}`;

    fetch(`/get-lap-times/${eventId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderLapTimes(data.lap_times);
            } else {
                showMessage('Could not load lap times.', false);
            }
        })
        .catch(error => console.error('[ERROR] Error loading lap times:', error));
};

const loadAllEvents = async () => {
    if (!App.currentUser) return;
    try {
        const response = await fetch(`/get-events/${App.currentUser.id}`);
        const data = await response.json();
        if (data.success) {
            allEvents = data.events;
            populateEventDropdown();
        }
    } catch (error) {
        console.error('[ERROR] Error fetching all events for lap times:', error);
    }
};

export const initLapTimes = () => {
    elements.lapTimeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventId = elements.lapTimeEventSelect.value;
        const lapTime = elements.lapTimeInput.value.trim();

        if (!eventId) {
            showMessage('Please select an event.', false);
            return;
        }

        // Basic validation for MM:SS.ms format
        const timeRegex = /^\d{2}:\d{2}\.\d{3}$/;
        if (!timeRegex.test(lapTime)) {
            showMessage('Please enter time in MM:SS.ms format (e.g., 01:45.123).', false);
            return;
        }

        fetch('/add-lap-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId,
                lapTime,
                username: App.currentUser.username
            }),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.lapTimeInput.value = '';
                loadLapTimesForEvent(eventId);
            }
        })
        .catch(error => {
            console.error('[ERROR] Error submitting lap time:', error);
            showMessage('Failed to submit lap time.', false);
        });
    });

    elements.lapTimeEventSelect.addEventListener('change', (e) => {
        loadLapTimesForEvent(e.target.value);
    });

    elements.backToFeaturesFromLapsBtn.addEventListener('click', () => {
        App.setView('features');
    });

    App.loadLapTimes = loadAllEvents;
};