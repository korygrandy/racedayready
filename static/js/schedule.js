import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let currentEvents = [];

const populateVehicleMultiSelect = async (selectElement) => {
    try {
        const response = await fetch(`/get-vehicles/${App.currentUser.id}`);
        const data = await response.json();
        selectElement.innerHTML = '';
        if (data.success && data.vehicles.length > 0) {
            data.vehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                selectElement.appendChild(option);
            });
        } else {
            selectElement.innerHTML = '<option disabled>No vehicles available</option>';
        }
    } catch (error) {
        console.error("Error fetching vehicles for event form:", error);
    }
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

        const startTime = new Date(event.start_time).toLocaleString();
        const endTime = event.end_time ? new Date(event.end_time).toLocaleString() : 'N/A';

        eventCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg">${event.name}</h3>
                    <p class="text-sm text-text-secondary">Starts: ${startTime}</p>
                    <p class="text-sm text-text-secondary">Ends: ${endTime}</p>
                    <p class="text-sm text-text-secondary mt-2">Vehicles: ${event.vehicles.length}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-event-btn text-sm" data-id="${event.id}">Edit</button>
                    <button class="delete-event-btn text-sm text-red-500" data-id="${event.id}">Delete</button>
                </div>
            </div>
        `;
        elements.eventList.appendChild(eventCard);
    });
};

const loadEvents = () => {
    if (!App.currentUser || !App.currentUser.id) return;
    populateVehicleMultiSelect(elements.eventVehiclesSelect);

    fetch(`/get-events/${App.currentUser.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentEvents = data.events;
                renderEvents();
            }
        });
};

export const initSchedule = () => {
    elements.addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedVehicles = Array.from(elements.eventVehiclesSelect.selectedOptions).map(opt => opt.value);
        const eventData = {
            name: elements.eventNameInput.value,
            startTime: elements.eventStartInput.value,
            endTime: elements.eventEndInput.value,
            vehicles: selectedVehicles,
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
            }
        });
    });

    elements.eventList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const eventId = button.dataset.id;
        const event = currentEvents.find(ev => ev.id === eventId);

        if (button.classList.contains('delete-event-btn')) {
            showConfirmationModal(`Are you sure you want to delete the event "${event.name}"?`, () => {
                fetch(`/delete-event/${App.currentUser.id}/${eventId}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        showMessage(data.message, data.success);
                        loadEvents();
                    });
            });
        }
        // Add edit logic here in the future
    });

    elements.backToPrepFromScheduleBtn.addEventListener('click', () => {
        App.setView('raceDayPrep');
    });

    App.loadEvents = loadEvents;
};