import * as elements from './elements.js';
import { showMessage, showConfirmationModal, createVehicleIcon } from './ui.js';
import { App } from './main.js';
import { populateYearDropdown, populateMakeDropdown, populateModelDropdown, filterDropdown } from './utils.js';

let currentVehicles = [];
let vehicleToEdit = null;
let currentSortOrder = 'desc'; // 'desc' for newest first, 'asc' for oldest first
let sortable = null;

const populateGarageDropdown = async (selectElement) => {
    try {
        const response = await fetch(`/get-garages/${App.currentUser.id}`);
        const data = await response.json();
        selectElement.innerHTML = '<option value="">No Garage</option>';
        if (data.success && data.garages.length > 0) {
            data.garages.forEach(garage => {
                const option = document.createElement('option');
                option.value = garage.id;
                option.textContent = garage.name;
                selectElement.appendChild(option);
            });
            elements.addVehicleFieldset.disabled = false;
            elements.noGaragesWarning.classList.add('hidden');
        } else {
            elements.addVehicleFieldset.disabled = true;
            elements.noGaragesWarning.classList.remove('hidden');
        }
    } catch (error) {
        console.error("[ERROR] Error fetching garages:", error);
    }
};

export const showEditVehicleModal = async (vehicle) => {
    vehicleToEdit = vehicle;
    console.log("[INFO] Showing edit vehicle modal for:", vehicle);

    // Populate simple fields
    elements.editVehicleYearSelect.value = vehicle.year;
    await populateMakeDropdown(elements.editVehicleMakeSelect, vehicle.make);
    await populateModelDropdown(vehicle.make, elements.editVehicleModelSelect, vehicle.model);
    await populateGarageDropdown(elements.editVehicleGarageSelect);
    elements.editVehicleGarageSelect.value = vehicle.garageId;

    if (vehicle.photo || vehicle.photoURL) {
        elements.editVehiclePhotoPreview.src = vehicle.photo || vehicle.photoURL;
        elements.editVehiclePhotoPreview.classList.remove('hidden');
        elements.editVehiclePhotoUrlInput.value = vehicle.photoURL || '';
    } else {
        elements.editVehiclePhotoPreview.classList.add('hidden');
        elements.editVehiclePhotoUrlInput.value = '';
    }

    elements.editVehicleModal.classList.remove('hidden');
};

const renderVehicles = () => {
    elements.vehicleList.innerHTML = '';

    const sortedVehicles = [...currentVehicles].sort((a, b) => {
        return currentSortOrder === 'desc' ? b.year - a.year : a.year - b.year;
    });

    if (sortedVehicles.length === 0) {
        elements.vehicleList.innerHTML = '<p class="text-text-secondary">No vehicles added yet.</p>';
        return;
    }

    sortedVehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'bg-card-darker p-4 rounded-lg flex items-center justify-between';
        vehicleCard.dataset.id = vehicle.id; // For SortableJS

        const photoContainer = document.createElement('div');
        photoContainer.className = 'w-16 h-16 mr-4';

        if (vehicle.photo || vehicle.photoURL) {
            const photoImg = document.createElement('img');
            photoImg.src = vehicle.photo || vehicle.photoURL;
            photoImg.className = 'w-full h-full object-cover rounded-md';
            photoContainer.appendChild(photoImg);
        } else {
            photoContainer.appendChild(createVehicleIcon());
        }

        const details = `
            <div>
                <h3 class="font-bold text-lg">${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                <p class="text-sm text-text-secondary">Garage: ${vehicle.garageName || 'N/A'}</p>
            </div>
        `;

        const buttons = `
            <div class="flex items-center space-x-4">
                <button class="edit-vehicle-btn text-text-secondary hover:text-white" data-id="${vehicle.id}" title="Edit Vehicle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                </button>
                <button class="delete-vehicle-btn text-red-500 hover:text-red-400" data-id="${vehicle.id}" title="Delete Vehicle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div class="drag-handle cursor-grab text-text-secondary">☰</div>
            </div>
        `;

        const leftDiv = document.createElement('div');
        leftDiv.className = 'flex items-center';
        leftDiv.appendChild(photoContainer);
        leftDiv.innerHTML += details;

        vehicleCard.appendChild(leftDiv);
        vehicleCard.innerHTML += buttons;

        elements.vehicleList.appendChild(vehicleCard);
    });
};

const loadVehicles = () => {
    if (!App.currentUser || !App.currentUser.id) return;
    fetch(`/get-vehicles/${App.currentUser.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentVehicles = data.vehicles;
                renderVehicles();
                if (data.limit_reached) {
                    elements.addVehicleFieldset.disabled = true;
                    elements.addVehicleBtn.textContent = 'Vehicle Limit Reached';
                }
            }
        })
        .catch(error => console.error('[ERROR] Error loading vehicles:', error));
};

export const initVehicle = () => {
    populateYearDropdown(elements.vehicleYearSelect);
    populateYearDropdown(elements.editVehicleYearSelect);
    populateMakeDropdown(elements.vehicleMakeSelect);

    elements.vehicleMakeSelect.addEventListener('change', (e) => populateModelDropdown(e.target.value, elements.vehicleModelSelect));
    elements.editVehicleMakeSelect.addEventListener('change', (e) => populateModelDropdown(e.target.value, elements.editVehicleModelSelect));

    const handlePhotoInput = (fileInput, urlInput, preview) => {
        const file = fileInput.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showMessage('Image size must be less than 5MB.', false);
                fileInput.value = '';
                return;
            }
            urlInput.value = ''; // Clear URL input
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };

    elements.vehiclePhotoInput.addEventListener('change', () => handlePhotoInput(elements.vehiclePhotoInput, elements.vehiclePhotoUrlInput, elements.vehiclePhotoPreview));
    elements.editVehiclePhotoInput.addEventListener('change', () => handlePhotoInput(elements.editVehiclePhotoInput, elements.editVehiclePhotoUrlInput, elements.editVehiclePhotoPreview));

    elements.vehiclePhotoUrlInput.addEventListener('input', () => {
        elements.vehiclePhotoInput.value = ''; // Clear file input
        elements.vehiclePhotoPreview.src = elements.vehiclePhotoUrlInput.value;
        elements.vehiclePhotoPreview.classList.remove('hidden');
    });

    elements.editVehiclePhotoUrlInput.addEventListener('input', () => {
        elements.editVehiclePhotoInput.value = ''; // Clear file input
        elements.editVehiclePhotoPreview.src = elements.editVehiclePhotoUrlInput.value;
        elements.editVehiclePhotoPreview.classList.remove('hidden');
    });

    elements.addVehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const vehicleData = {
            year: elements.vehicleYearSelect.value,
            make: elements.vehicleMakeSelect.value,
            model: elements.vehicleModelSelect.value,
            garageId: elements.vehicleGarageSelect.value,
            photo: elements.vehiclePhotoPreview.src.startsWith('data:') ? elements.vehiclePhotoPreview.src : null,
            photoURL: elements.vehiclePhotoUrlInput.value || null
        };

        fetch(`/add-vehicle/${App.currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData),
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.addVehicleForm.reset();
                elements.vehiclePhotoPreview.classList.add('hidden');
                loadVehicles();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error adding vehicle:', error);
            showMessage('Failed to add vehicle.', false);
        });
    });

    elements.editVehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const vehicleData = {
            year: elements.editVehicleYearSelect.value,
            make: elements.editVehicleMakeSelect.value,
            model: elements.editVehicleModelSelect.value,
            garageId: elements.editVehicleGarageSelect.value,
            photo: elements.editVehiclePhotoPreview.src.startsWith('data:') ? elements.editVehiclePhotoPreview.src : null,
            photoURL: elements.editVehiclePhotoUrlInput.value || null
        };

        fetch(`/update-vehicle/${App.currentUser.id}/${vehicleToEdit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData),
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.editVehicleModal.classList.add('hidden');
                loadVehicles();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error updating vehicle:', error);
            showMessage('Failed to update vehicle.', false);
        });
    });

    elements.cancelEditVehicleBtn.addEventListener('click', () => {
        elements.editVehicleModal.classList.add('hidden');
    });

    elements.backToFeaturesFromVehicleBtn.addEventListener('click', () => {
        App.setView('features');
    });

    elements.goToGarageLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("[INFO] Navigating to Garage Management from warning link.");
        App.setView('garageManagement');
    });

    // FIX: Added null check to prevent crash on load
    if (elements.manageGaragesLinkBtn) {
        elements.manageGaragesLinkBtn.addEventListener('click', () => {
            App.setView('garageManagement');
        });
    } else {
        console.warn("[WARN] Element 'manage-garages-link-btn' not found. Listener not attached.");
    }

    elements.vehicleList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const vehicleId = button.dataset.id;
        const vehicle = currentVehicles.find(v => v.id === vehicleId);

        if (button.classList.contains('delete-vehicle-btn')) {
            showConfirmationModal('Are you sure you want to delete this vehicle?', () => {
                fetch(`/delete-vehicle/${App.currentUser.id}/${vehicleId}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        showMessage(data.message, data.success);
                        loadVehicles();
                    })
                    .catch(error => {
                        console.error('[ERROR] Error deleting vehicle:', error);
                        showMessage('Failed to delete vehicle.', false);
                    });
            });
        } else if (button.classList.contains('edit-vehicle-btn')) {
            showEditVehicleModal(vehicle);
        }
    });

    elements.vehicleSortBtn.addEventListener('click', () => {
        currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
        console.log(`[DEBUG] Vehicle sort order changed to: ${currentSortOrder}`);
        elements.vehicleSortBtn.textContent = `Sort by Year (${currentSortOrder === 'desc' ? 'Newest' : 'Oldest'} First)`;
        renderVehicles();
    });

    sortable = new Sortable(elements.vehicleList, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: () => {
            const orderedIds = Array.from(elements.vehicleList.children).map(item => item.dataset.id);
            fetch(`/update-vehicle-order/${App.currentUser.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: orderedIds }),
            })
            .then(res => res.json())
            .then(data => showMessage(data.message, data.success))
            .catch(error => {
                console.error('[ERROR] Error updating vehicle order:', error);
                showMessage('Failed to update vehicle order.', false);
            });
        }
    });

    // Search listeners
    elements.vehicleYearSearch.addEventListener('keyup', () => filterDropdown(elements.vehicleYearSearch, elements.vehicleYearSelect));
    elements.vehicleMakeSearch.addEventListener('keyup', () => filterDropdown(elements.vehicleMakeSearch, elements.vehicleMakeSelect));
    elements.vehicleModelSearch.addEventListener('keyup', () => filterDropdown(elements.vehicleModelSearch, elements.vehicleModelSelect));
    elements.editVehicleYearSearch.addEventListener('keyup', () => filterDropdown(elements.editVehicleYearSearch, elements.editVehicleYearSelect));
    elements.editVehicleMakeSearch.addEventListener('keyup', () => filterDropdown(elements.editVehicleMakeSearch, elements.editVehicleMakeSelect));
    elements.editVehicleModelSearch.addEventListener('keyup', () => filterDropdown(elements.editVehicleModelSearch, elements.editVehicleModelSelect));

    App.loadVehicles = () => {
        populateGarageDropdown(elements.vehicleGarageSelect);
        loadVehicles();
    };
};
