import * as elements from './elements.js';
import { showMessage, showConfirmationModal, createVehicleIcon } from './ui.js';
import { App } from './main.js';
import { showEditVehicleModal } from './vehicle.js';

let currentEvents = [];
let eventToEdit = null;

/**
 * Fetches the next race day and updates the countdown display in the header.
 */
export const updateRacedayCountdown = () => {
    if (!App.currentUser) {
        elements.racedayCountdownContainer.classList.add('hidden');
        return;
    }

    elements.racedayCountdownContainer.classList.remove('hidden');

    const showNoRacedayState = () => {
        elements.racedayCountdownLabel.textContent = "No Raceday Scheduled";
        elements.racedayCountdownCircle.classList.add('hidden');
        elements.noRacedayIcon.classList.remove('hidden'); // Shows '+ Add Race'
        elements.racedayCountdownLabel.classList.remove('hidden'); // Shows the text
    };

    fetch(`/get-next-raceday/${App.currentUser.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.event) {
                const now = new Date();
                const eventDate = new Date(data.event.start_time);
                const diffTime = eventDate - now;

                if (diffTime > 0) {
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    elements.racedayCountdownDays.textContent = diffDays;
                    elements.racedayCountdownLabel.textContent = "Days Until Raceday:";
                    elements.racedayCountdownCircle.classList.remove('hidden');
                    elements.noRacedayIcon.classList.add('hidden');
                    elements.racedayCountdownLabel.classList.remove('hidden');
                } else {
                    showNoRacedayState();
                }
            } else {
                showNoRacedayState();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error fetching next raceday:', error);
            showNoRacedayState();
        });
};


const populateVehicleSelector = async (container, selectedVehicleIds = []) => {
    try {
        const response = await fetch(`/get-vehicles-for-event-form/${App.currentUser.id}`);
        const data = await response.json();
        container.innerHTML = '';
        if (data.success && data.vehicles.length > 0) {
            data.vehicles.forEach(vehicle => {
                const vehicleEl = document.createElement('div');
                vehicleEl.className = 'vehicle-selector-item';
                vehicleEl.dataset.vehicleId = vehicle.id;

                const isSelected = selectedVehicleIds.includes(vehicle.id);
                if (isSelected) {
                    vehicleEl.classList.add('selected');
                }

                if (vehicle.photo || vehicle.photoURL) {
                    const img = document.createElement('img');
                    img.src = vehicle.photo || vehicle.photoURL;
                    img.className = 'w-full h-full object-cover rounded-md';
                    vehicleEl.appendChild(img);
                } else {
                    vehicleEl.appendChild(createVehicleIcon('w-full h-full'));
                }

                vehicleEl.addEventListener('click', () => {
                    vehicleEl.classList.toggle('selected');
                });

                container.appendChild(vehicleEl);
            });
        } else {
            container.innerHTML = '<p class="text-text-secondary text-sm col-span-full">No vehicles available. Please add one in Vehicle Management.</p>';
        }
    } catch (error) {
        console.error("[ERROR] Error fetching vehicles for event form:", error);
    }
};

const populateChecklistMultiSelect = async (selectElement, selectedChecklistIds = []) => {
    try {
        const response = await fetch(`/get-checklists/${App.currentUser.id}`);
        const data = await response.json();
        selectElement.innerHTML = '';
        if (data.success && data.checklists.length > 0) {
            data.checklists.forEach(checklist => {
                const option = document.createElement('option');
                option.value = checklist.id;
                option.textContent = checklist.name;
                if (selectedChecklistIds.includes(checklist.id)) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        } else {
            selectElement.innerHTML = '<option disabled>No checklists available</option>';
        }
    } catch (error) {
        console.error("[ERROR] Error fetching checklists for event form:", error);
    }
};

const populateTrackDropdown = async (selectElement, selectedTrackId = null) => {
    try {
        const response = await fetch('/get-all-tracks');
        const data = await response.json();
        selectElement.innerHTML = '<option value="">Select a Track</option>';
        if (data.success && data.tracks.length > 0) {
            data.tracks.forEach(track => {
                const option = document.createElement('option');
                option.value = track.id;
                option.textContent = track.name;
                if (selectedTrackId && track.id === selectedTrackId) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        } else {
            selectElement.innerHTML = '<option disabled>No tracks available</option>';
        }
    } catch (error) {
        console.error("[ERROR] Error fetching tracks for event form:", error);
    }
};

const showEditEventModal = (event) => {
    eventToEdit = event;
    console.log("[INFO] Showing edit event modal for:", event);
    elements.editEventNameInput.value = event.name;

    if (event.start_time) {
        elements.editEventStartInput.value = event.start_time.slice(0, 16);
    }
    if (event.end_time) {
        elements.editEventEndInput.value = event.end_time.slice(0, 16);
    }

    elements.editIsRacedayCheckbox.checked = event.is_raceday;
    populateVehicleSelector(elements.editEventVehiclesContainer, event.vehicles.map(v => v.id));
    populateChecklistMultiSelect(elements.editEventChecklistsSelect, event.checklists);
    populateTrackDropdown(elements.editEventTrackSelect, event.trackId);
    elements.editEventModal.classList.remove('hidden');
};

const renderEvents = () => {
    elements.eventList.innerHTML = '';
    if (currentEvents.length === 0) {
        elements.eventList.innerHTML = '<p class="text-text-secondary">No upcoming events.</p>';
        return;
    }

    currentEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'bg-card-darker p-4 rounded-lg';
        eventCard.dataset.eventId = event.id;

        const startTime = new Date(event.start_time).toLocaleString();
        const endTime = event.end_time ? new Date(event.end_time).toLocaleString() : 'N/A';
        const trackName = event.trackName ? `at ${event.trackName}` : '';

        const trackPhotoHtml = (event.trackPhoto || event.trackPhotoURL)
            ? `<img src="${event.trackPhoto || event.trackPhotoURL}" class="w-16 h-16 object-cover rounded-md mr-4">`
            : '';

        let vehicleHtml = '<p class="text-sm text-text-secondary mt-2">No vehicles assigned.</p>';
        if (event.vehicles && event.vehicles.length > 0) {
            vehicleHtml = '<div class="mt-2 flex flex-wrap gap-2">';
            event.vehicles.forEach(vehicle => {
                const vehicleContainer = document.createElement('div');
                vehicleContainer.className = 'event-vehicle-photo w-12 h-12 cursor-pointer hover:opacity-75';
                vehicleContainer.title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                vehicleContainer.dataset.vehicleId = vehicle.id;

                if (vehicle.photo || vehicle.photoURL) {
                    const img = document.createElement('img');
                    img.src = vehicle.photo || vehicle.photoURL;
                    img.className = 'w-full h-full object-cover rounded-md';
                    vehicleContainer.appendChild(img);
                } else {
                    vehicleContainer.appendChild(createVehicleIcon('w-12 h-12'));
                }
                vehicleHtml += vehicleContainer.outerHTML;
            });
            vehicleHtml += '</div>';
        }

        eventCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex">
                    ${trackPhotoHtml}
                    <div>
                        <h3 class="font-bold text-lg">${event.name} ${trackName} ${event.is_raceday ? '🏁' : ''}</h3>
                        <p class="text-sm text-text-secondary">Starts: ${startTime}</p>
                        <p class="text-sm text-text-secondary">Ends: ${endTime}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="edit-event-btn text-text-secondary hover:text-white" data-id="${event.id}" title="Edit Event">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    </button>
                    <button class="delete-event-btn text-red-500 hover:text-red-400" data-id="${event.id}" title="Delete Event">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
            ${vehicleHtml}
        `;
        elements.eventList.appendChild(eventCard);
    });
};

const loadEvents = () => {
    if (!App.currentUser || !App.currentUser.id) return;
    populateVehicleSelector(elements.eventVehiclesContainer);
    populateChecklistMultiSelect(elements.eventChecklistsSelect);
    populateTrackDropdown(elements.eventTrackSelect);

    fetch(`/get-events/${App.currentUser.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentEvents = data.events;
                renderEvents();
            }
        })
        .catch(error => console.error('[ERROR] Error loading events:', error));
};

export const initSchedule = () => {
    elements.addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const startTimeStr = elements.eventStartInput.value;
        const endTimeStr = elements.eventEndInput.value;

        if (endTimeStr) {
            const startDate = new Date(startTimeStr);
            const endDate = new Date(endTimeStr);
            if (endDate < startDate) {
                console.warn("[VALIDATION] End time cannot be earlier than start time.");
                showMessage("End time cannot be earlier than start time.", false);
                return;
            }
        }

        const selectedVehicles = Array.from(elements.eventVehiclesContainer.querySelectorAll('.vehicle-selector-item.selected')).map(el => el.dataset.vehicleId);
        const selectedChecklists = Array.from(elements.eventChecklistsSelect.selectedOptions).map(opt => opt.value);

        const eventData = {
            name: elements.eventNameInput.value,
            startTime: new Date(startTimeStr).toISOString(),
            endTime: endTimeStr ? new Date(endTimeStr).toISOString() : null,
            vehicles: selectedVehicles,
            checklists: selectedChecklists,
            trackId: elements.eventTrackSelect.value,
            isRaceday: elements.isRacedayCheckbox.checked,
        };

        fetch(`/add-event/${App.currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.addEventForm.reset();
                loadEvents();
                updateRacedayCountdown();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error adding event:', error);
            showMessage('Failed to add event.', false);
        });
    });

    elements.editEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const startTimeStr = elements.editEventStartInput.value;
        const endTimeStr = elements.editEventEndInput.value;

        if (endTimeStr) {
            const startDate = new Date(startTimeStr);
            const endDate = new Date(endTimeStr);
            if (endDate < startDate) {
                console.warn("[VALIDATION] End time cannot be earlier than start time.");
                showMessage("End time cannot be earlier than start time.", false);
                return;
            }
        }

        const selectedVehicles = Array.from(elements.editEventVehiclesContainer.querySelectorAll('.vehicle-selector-item.selected')).map(el => el.dataset.vehicleId);
        const selectedChecklists = Array.from(elements.editEventChecklistsSelect.selectedOptions).map(opt => opt.value);

        const eventData = {
            name: elements.editEventNameInput.value,
            startTime: new Date(startTimeStr).toISOString(),
            endTime: endTimeStr ? new Date(endTimeStr).toISOString() : null,
            vehicles: selectedVehicles,
            checklists: selectedChecklists,
            trackId: elements.editEventTrackSelect.value,
            isRaceday: elements.editIsRacedayCheckbox.checked,
        };

        fetch(`/update-event/${App.currentUser.id}/${eventToEdit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.editEventModal.classList.add('hidden');
                loadEvents();
                updateRacedayCountdown();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error updating event:', error);
            showMessage('Failed to update event.', false);
        });
    });

    elements.eventList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        const vehiclePhoto = e.target.closest('.event-vehicle-photo');

        if (button) {
            const eventId = button.dataset.id;
            const event = currentEvents.find(ev => ev.id === eventId);

            if (button.classList.contains('delete-event-btn')) {
                showConfirmationModal(`Are you sure you want to delete the event "${event.name}"?`, () => {
                    fetch(`/delete-event/${App.currentUser.id}/${eventId}`, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(data => {
                            showMessage(data.message, data.success);
                            loadEvents();
                            updateRacedayCountdown();
                        })
                        .catch(error => {
                            console.error('[ERROR] Error deleting event:', error);
                            showMessage('Failed to delete event.', false);
                        });
                });
            } else if (button.classList.contains('edit-event-btn')) {
                showEditEventModal(event);
            }
        } else if (vehiclePhoto) {
            const eventId = vehiclePhoto.closest('.bg-card-darker').dataset.eventId;
            const vehicleId = vehiclePhoto.dataset.vehicleId;
            const event = currentEvents.find(ev => ev.id === eventId);
            const vehicle = event.vehicles.find(v => v.id === vehicleId);
            if(vehicle) {
                console.log("[INFO] Vehicle icon clicked, showing edit modal for:", vehicle);
                showEditVehicleModal(vehicle);
            }
        }
    });

    elements.cancelEditEventBtn.addEventListener('click', () => {
        elements.editEventModal.classList.add('hidden');
    });

    elements.backToPrepFromScheduleBtn.addEventListener('click', () => {
        App.setView('raceDayPrep');
    });

    elements.racedayCountdownContainer.addEventListener('click', () => {
        console.log("[INFO] Raceday countdown clicked, navigating to schedule.");
        App.setView('raceSchedule');
    });

    elements.addRacedayLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("[INFO] '+ Add Race' link clicked, navigating to schedule.");
        App.setView('raceSchedule');
    });

    App.loadEvents = loadEvents;
};
