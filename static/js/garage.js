import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

const updateGarage = (garageId, newName) => {
    fetch(`/update-garage/${App.currentUser.id}/${garageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            loadGarages();
        }
    });
};

const deleteGarage = (garageId, garageName) => {
    showConfirmationModal(
        `Are you sure you want to permanently delete the garage "${garageName}"?`,
        () => {
            console.log(`Confirmed deletion for garage ID: ${garageId}`);
            fetch(`/delete-garage/${App.currentUser.id}/${garageId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                showMessage(data.message, data.success);
                if (data.success) {
                    loadGarages();
                }
            });
        }
    );
};

const loadGarages = () => {
    if (!App.currentUser || !App.currentUser.id) return;
    console.log(`Loading garages for profile ID: ${App.currentUser.id}`);

    fetch(`/get-garages/${App.currentUser.id}`)
        .then(response => response.json())
        .then(data => {
            elements.garageList.innerHTML = '';
            if (data.success) {
                if (data.limit_reached) {
                    elements.addGarageForm.querySelector('input').disabled = true;
                    elements.addGarageForm.querySelector('button').disabled = true;
                    elements.addGarageForm.querySelector('button').textContent = 'Garage Limit Reached';
                }

                if (data.garages.length > 0) {
                    data.garages.forEach(garage => {
                        const garageElement = document.createElement('div');
                        garageElement.className = 'bg-card-darker p-4 rounded-lg';

                        const header = document.createElement('div');
                        header.className = 'flex justify-between items-center';

                        const nameSpan = document.createElement('span');
                        nameSpan.textContent = garage.name;
                        nameSpan.className = 'cursor-pointer hover:text-blue-400 font-bold text-lg';

                        const nameInput = document.createElement('input');
                        nameInput.type = 'text';
                        nameInput.value = garage.name;
                        nameInput.maxLength = 25;
                        nameInput.className = 'hidden w-full bg-input border border-border rounded-md p-2';

                        nameSpan.addEventListener('click', () => {
                            nameSpan.classList.add('hidden');
                            nameInput.classList.remove('hidden');
                            nameInput.focus();
                        });

                        const saveEdit = () => {
                            const newName = nameInput.value.trim();
                            if (newName && newName !== garage.name) {
                                updateGarage(garage.id, newName);
                            } else {
                                nameInput.classList.add('hidden');
                                nameSpan.classList.remove('hidden');
                            }
                        };

                        nameInput.addEventListener('blur', saveEdit);
                        nameInput.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                saveEdit();
                            } else if (e.key === 'Escape') {
                                nameInput.value = garage.name;
                                nameInput.classList.add('hidden');
                                nameSpan.classList.remove('hidden');
                            }
                        });

                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = '&times;';
                        deleteBtn.className = 'ml-4 text-red-500 hover:text-red-400 font-bold text-2xl px-2 leading-none';
                        deleteBtn.title = 'Delete Garage';
                        deleteBtn.onclick = () => deleteGarage(garage.id, garage.name);

                        const leftContainer = document.createElement('div');
                        leftContainer.className = 'flex-grow';
                        leftContainer.appendChild(nameSpan);
                        leftContainer.appendChild(nameInput);

                        header.appendChild(leftContainer);
                        header.appendChild(deleteBtn);
                        garageElement.appendChild(header);

                        const vehicleContainer = document.createElement('div');
                        vehicleContainer.className = 'mt-4 flex flex-wrap gap-4';
                        if (garage.vehicles && garage.vehicles.length > 0) {
                            garage.vehicles.forEach(vehicle => {
                                const photoContainer = document.createElement('div');
                                photoContainer.className = 'w-24 h-24';

                                if(vehicle.photo || vehicle.photoURL) {
                                    const vehiclePhoto = document.createElement('img');
                                    vehiclePhoto.src = vehicle.photo || vehicle.photoURL;
                                    vehiclePhoto.className = 'w-full h-full object-cover rounded-md cursor-pointer hover:opacity-75';
                                    vehiclePhoto.title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                                    photoContainer.appendChild(vehiclePhoto);
                                } else {
                                    photoContainer.appendChild(createVehicleIcon('w-24 h-24'));
                                }

                                photoContainer.onclick = () => {
                                    console.log(`Navigating to Vehicle Management for vehicle ID: ${vehicle.id}`);
                                    App.setView('vehicleManagement');
                                };
                                vehicleContainer.appendChild(photoContainer);
                            });
                        } else {
                            const addVehicleLink = document.createElement('a');
                            addVehicleLink.href = '#';
                            addVehicleLink.className = 'text-blue-500 hover:underline';
                            addVehicleLink.textContent = 'Add a vehicle to this garage';
                            addVehicleLink.onclick = (e) => {
                                e.preventDefault();
                                App.setView('vehicleManagement');
                            };
                            vehicleContainer.innerHTML = '<p class="text-sm text-text-secondary">No vehicles in this garage. </p>';
                            vehicleContainer.querySelector('p').appendChild(addVehicleLink);
                        }
                        garageElement.appendChild(vehicleContainer);

                        elements.garageList.appendChild(garageElement);
                    });
                } else {
                    elements.garageList.innerHTML = '<p class="text-text-secondary">No garages created yet.</p>';
                }
            }
        });
};

export const initGarage = () => {
    elements.addGarageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const garageName = elements.garageNameInput.value.trim();
        if (!garageName) {
            showMessage('Garage name cannot be empty.', false);
            return;
        }
        if (!App.currentUser || !App.currentUser.id) {
            showMessage('No active profile selected.', false);
            return;
        }

        console.log(`Adding new garage: ${garageName}`);
        fetch('/add-garage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profileId: App.currentUser.id,
                garageName: garageName
            }),
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.garageNameInput.value = '';
                loadGarages();
            }
        });
    });

    elements.backToFeaturesFromGarageBtn.addEventListener('click', () => {
        App.setView('features');
    });

    App.loadGarages = loadGarages;
};