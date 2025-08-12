import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let allEvents = [];
let currentLapTimes = [];
let lapTimeDeletionEnabled = false;

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

const renderLapTimes = () => {
    elements.lapTimeList.innerHTML = '';
    if (currentLapTimes.length === 0) {
        elements.lapTimeList.innerHTML = '<p class="text-text-secondary">No lap times recorded for this event yet.</p>';
        return;
    }

    currentLapTimes.forEach((time, index) => {
        const rank = index + 1;
        let medal = '';
        if (rank === 1) medal = '🥇';
        else if (rank === 2) medal = '🥈';
        else if (rank === 3) medal = '🥉';

        const timeEl = document.createElement('div');
        timeEl.className = 'flex items-center justify-between bg-card-darker p-3 rounded-lg';

        const isOwner = time.username === App.currentUser.username;
        const canEdit = isOwner;
        const canDelete = lapTimeDeletionEnabled; // Admin can delete any time

        const cursorClass = canEdit ? 'cursor-pointer hover:bg-interactive-hover' : '';
        const deleteButtonHtml = canDelete ? `<button class="delete-lap-time-btn text-red-500 hover:text-red-400 ml-4" data-lap-id="${time.id}" title="Delete Lap Time">&times;</button>` : '';

        timeEl.innerHTML = `
            <div class="flex items-center">
                <span class="text-xl font-bold w-8">${rank}${medal}</span>
                <span class="font-semibold">${time.username}</span>
            </div>
            <div class="flex items-center">
                <div class="lap-time-display ${cursorClass}" data-lap-id="${time.id}">
                    <span class="font-mono text-lg lap-time-text">${time.lapTime}</span>
                    <input type="text" class="hidden font-mono text-lg bg-input rounded px-2 py-1" value="${time.lapTime}">
                </div>
                ${deleteButtonHtml}
            </div>
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
                currentLapTimes = data.lap_times;
                lapTimeDeletionEnabled = data.deletion_enabled;
                renderLapTimes();
            } else {
                showMessage('Could not load lap times.', false);
            }
        })
        .catch(error => console.error('[ERROR] Error loading lap times:', error));
};

const loadAllEvents = async () => {
    if (!App.currentUser) return;
    try {
        const response = await fetch('/get-all-events');
        const data = await response.json();
        if (data.success) {
            allEvents = data.events;
            populateEventDropdown();

            // FIX: Automatically load the first event's data if it exists
            const racedayEvents = allEvents.filter(event => event.is_raceday);
            if (racedayEvents.length > 0) {
                elements.lapTimeEventSelect.value = racedayEvents[0].id;
                loadLapTimesForEvent(racedayEvents[0].id);
            }
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

    elements.lapTimeList.addEventListener('click', (e) => {
        const displayDiv = e.target.closest('.lap-time-display');
        const deleteBtn = e.target.closest('.delete-lap-time-btn');

        if (deleteBtn) {
            const lapId = deleteBtn.dataset.lapId;
            showConfirmationModal('Are you sure you want to delete this lap time?', () => {
                fetch(`/delete-lap-time/${lapId}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        showMessage(data.message, data.success);
                        if(data.success) loadLapTimesForEvent(elements.lapTimeEventSelect.value);
                    })
                    .catch(error => {
                        console.error('[ERROR] Error deleting lap time:', error);
                        showMessage('Failed to delete lap time.', false);
                    });
            });
            return;
        }

        if (!displayDiv) return;

        const lapId = displayDiv.dataset.lapId;
        const lap = currentLapTimes.find(lt => lt.id === lapId);

        if (lap.username !== App.currentUser.username) return;

        const textSpan = displayDiv.querySelector('.lap-time-text');
        const input = displayDiv.querySelector('input');

        textSpan.classList.add('hidden');
        input.classList.remove('hidden');
        input.focus();

        const saveEdit = () => {
            const newLapTime = input.value.trim();
            const timeRegex = /^\d{2}:\d{2}\.\d{3}$/;

            if (newLapTime && newLapTime !== lap.lapTime && timeRegex.test(newLapTime)) {
                fetch(`/update-lap-time/${lapId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lapTime: newLapTime, username: App.currentUser.username }),
                })
                .then(res => res.json())
                .then(data => {
                    showMessage(data.message, data.success);
                    if (data.success) {
                        loadLapTimesForEvent(elements.lapTimeEventSelect.value);
                    } else {
                        input.classList.add('hidden');
                        textSpan.classList.remove('hidden');
                    }
                })
                .catch(error => {
                    console.error('[ERROR] Error updating lap time:', error);
                    showMessage('Failed to update lap time.', false);
                    input.classList.add('hidden');
                    textSpan.classList.remove('hidden');
                });
            } else {
                if(newLapTime && !timeRegex.test(newLapTime)) {
                    showMessage('Invalid time format. Use MM:SS.ms', false);
                }
                input.classList.add('hidden');
                textSpan.classList.remove('hidden');
            }
        };

        input.onblur = saveEdit;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') saveEdit();
            else if (e.key === 'Escape') {
                input.value = lap.lapTime;
                input.classList.add('hidden');
                textSpan.classList.remove('hidden');
            }
        };
    });

    elements.backToFeaturesFromLapsBtn.addEventListener('click', () => {
        App.setView('features');
    });

    App.loadLapTimes = loadAllEvents;
};
