import * as elements from './elements.js';
import { showMessage, showConfirmationModal, createVehicleIcon } from './ui.js';
import { App } from './main.js';

let garageToShare = null;
let garageToUnlock = null;

const updateGarage = (garageId, updates) => {
    fetch(`/update-garage/${App.currentUser.id}/${garageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.success);
        if (data.success) {
            loadGarages();
        }
    })
    .catch(error => {
        console.error('[ERROR] Error updating garage:', error);
        showMessage('Failed to update garage.', false);
    });
};

const deleteGarage = (garageId, garageName) => {
    showConfirmationModal(
        `Are you sure you want to permanently delete the garage "${garageName}"?`,
        () => {
            console.log(`[INFO] Confirmed deletion for garage ID: ${garageId}`);
            fetch(`/delete-garage/${App.currentUser.id}/${garageId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                showMessage(data.message, data.success);
                if (data.success) {
                    loadGarages();
                }
            })
            .catch(error => {
                console.error('[ERROR] Error deleting garage:', error);
                showMessage('Failed to delete garage.', false);
            });
        }
    );
};

const showShareGarageModal = (garage) => {
    garageToShare = garage;
    elements.shareGarageModal.classList.remove('hidden');
    elements.garageDoorCodeInput.value = garage.garageDoorCode || '';
    elements.garageDoorCodeInput.focus();
};

const showUnlockGarageModal = (garage) => {
    garageToUnlock = garage;
    elements.unlockGarageModal.classList.remove('hidden');
    elements.unlockGarageCodeInput.value = '';
    elements.unlockGarageCodeInput.focus();
}

const loadGarages = () => {
    if (!App.currentUser || !App.currentUser.id) return;
    console.log(`[INFO] Loading garages for profile ID: ${App.currentUser.id}`);

    fetch(`/get-garages/${App.currentUser.id}`)
        .then(response => response.json())
        .then(data => {
            elements.garageList.innerHTML = '';
            elements.sharedGarageList.innerHTML = '';
            if (data.success) {
                if (data.limit_reached) {
                    elements.addGarageForm.querySelector('input').disabled = true;
                    elements.addGarageForm.querySelector('button').disabled = true;
                    elements.addGarageForm.querySelector('button').textContent = 'Garage Limit Reached';
                }

                const myGarages = data.garages.filter(g => g.ownerId === App.currentUser.id);
                const sharedGarages = data.garages.filter(g => g.ownerId !== App.currentUser.id);

                if (myGarages.length > 0) {
                    myGarages.forEach(garage => {
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
                                updateGarage(garage.id, { name: newName });
                            } else {
                                nameInput.classList.add('hidden');
                                nameSpan.classList.remove('hidden');
                            }
                        };

                        nameInput.addEventListener('blur', saveEdit);
                        nameInput.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') saveEdit();
                            else if (e.key === 'Escape') {
                                nameInput.value = garage.name;
                                nameInput.classList.add('hidden');
                                nameSpan.classList.remove('hidden');
                            }
                        });

                        const shareBtn = document.createElement('button');
                        shareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>`;
                        shareBtn.className = `ml-4 ${garage.shared ? 'text-green-500' : 'text-text-secondary'} hover:text-white`;
                        shareBtn.title = garage.shared ? 'Edit Share Settings' : 'Share Garage';
                        shareBtn.onclick = () => showShareGarageModal(garage);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
                        deleteBtn.className = 'ml-4 text-red-500 hover:text-red-400';
                        deleteBtn.title = 'Delete Garage';
                        deleteBtn.onclick = () => deleteGarage(garage.id, garage.name);

                        const leftContainer = document.createElement('div');
                        leftContainer.className = 'flex-grow';
                        leftContainer.appendChild(nameSpan);
                        leftContainer.appendChild(nameInput);
                        
                        const buttonContainer = document.createElement('div');
                        buttonContainer.className = 'flex items-center';
                        buttonContainer.appendChild(shareBtn);
                        buttonContainer.appendChild(deleteBtn);

                        header.appendChild(leftContainer);
                        header.appendChild(buttonContainer);
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
                                    console.log(`[INFO] Navigating to Vehicle Management for vehicle ID: ${vehicle.id}`);
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

                if (sharedGarages.length > 0) {
                    sharedGarages.forEach(garage => {
                        const garageElement = document.createElement('div');
                        garageElement.className = 'bg-card-darker p-4 rounded-lg';
                        const isUnlocked = App.unlockedGarages.includes(garage.id);

                        let vehicleHtml = '';
                        if (isUnlocked) {
                            if (garage.vehicles && garage.vehicles.length > 0) {
                                garage.vehicles.forEach(v => {
                                    vehicleHtml += `<div class="w-16 h-16" title="${v.year} ${v.make} ${v.model}">${v.photo || v.photoURL ? `<img src="${v.photo || v.photoURL}" class="w-full h-full object-cover rounded-md">` : createVehicleIcon('w-16 h-16').outerHTML}</div>`;
                                });
                            } else {
                                vehicleHtml = `<p class="text-sm text-text-secondary">No vehicles in this garage.</p>`;
                            }
                        }

                        garageElement.innerHTML = `
                            <div class="flex justify-between items-center">
                                <div>
                                    <h3 class="font-bold text-lg">${garage.name}</h3>
                                    <p class="text-sm text-text-secondary">Owner: ${garage.ownerUsername}</p>
                                </div>
                                ${!isUnlocked ? `<button class="unlock-garage-btn bg-blue-500 text-white px-3 py-1 rounded-md text-sm" data-id="${garage.id}">Unlock</button>` : `<span class="text-green-500 text-sm font-bold">Unlocked</span>`}
                            </div>
                            <div class="mt-4 flex flex-wrap gap-2">
                                ${vehicleHtml}
                            </div>
                        `;
                        elements.sharedGarageList.appendChild(garageElement);
                    });
                } else {
                    elements.sharedGarageList.innerHTML = '<p class="text-text-secondary">No garages have been shared with you.</p>';
                }

            }
        })
        .catch(error => console.error('[ERROR] Error loading garages:', error));
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

        console.log(`[INFO] Adding new garage: ${garageName}`);
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
        })
        .catch(error => {
            console.error('[ERROR] Error adding garage:', error);
            showMessage('Failed to add garage.', false);
        });
    });

    if (elements.shareGarageForm) {
        elements.shareGarageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = elements.garageDoorCodeInput.value.trim();
            const updates = {
                shared: true,
                garageDoorCode: code
            };
            updateGarage(garageToShare.id, updates);
            elements.shareGarageModal.classList.add('hidden');
        });
    }

    if (elements.unlockGarageForm) {
        elements.unlockGarageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = elements.unlockGarageCodeInput.value.trim();
            fetch(`/verify-garage-code/${garageToUnlock.ownerId}/${garageToUnlock.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            })
            .then(res => res.json())
            .then(data => {
                showMessage(data.message, data.success);
                if (data.success) {
                    App.unlockedGarages.push(garageToUnlock.id);
                    elements.unlockGarageModal.classList.add('hidden');
                    loadGarages();
                }
            });
        });
    }

    elements.cancelShareGarageBtn.addEventListener('click', () => elements.shareGarageModal.classList.add('hidden'));
    elements.cancelUnlockGarageBtn.addEventListener('click', () => elements.unlockGarageModal.classList.add('hidden'));

    elements.sharedGarageList.addEventListener('click', (e) => {
        const unlockBtn = e.target.closest('.unlock-garage-btn');
        if (unlockBtn) {
            const garageId = unlockBtn.dataset.id;
            const garage = App.sharedGarages.find(g => g.id === garageId);
            showUnlockGarageModal(garage);
        }
    });

    elements.backToFeaturesFromGarageBtn.addEventListener('click', () => {
        App.setView('features');
    });

    App.loadGarages = loadGarages;
};
