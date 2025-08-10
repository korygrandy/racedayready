import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';
import { populateYearDropdown, populateMakeDropdown, populateModelDropdown } from './utils.js';

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
        console.error("Error fetching garages:", error);
    }
};

const showEditVehicleModal = async (vehicle) => {
    vehicleToEdit = vehicle;
    console.log("Showing edit vehicle modal for:", vehicle);

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

        const photoSrc = vehicle.photo || vehicle.photoURL || 'static/stock-car.png';
        const photo = `<img src="${photoSrc}" class="w-16 h-16 object-cover rounded-md mr-4">`;

        const details = `
            <div>
                <h3 class="font-bold text-lg">${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                <p class="text-sm text-text-secondary">Garage: ${vehicle.garageName || 'N/A'}</p>
            </div>
        `;

        const buttons = `
            <div class="flex items-center space-x-2">
                <button class="edit-vehicle-btn px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm" data-id="${vehicle.id}">Edit</button>
                <button class="delete-vehicle-btn px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-500 text-sm" data-id="${vehicle.id}">Delete</button>
                <div class="drag-handle cursor-grab text-text-secondary">☰</div>
            </div>
        `;

        vehicleCard.innerHTML = `<div class="flex items-center">${photo}${details}</div>${buttons}`;
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
        });
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
        console.log("Navigating to Garage Management from warning link.");
        App.setView('garageManagement');
    });

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
                    });
            });
        } else if (button.classList.contains('edit-vehicle-btn')) {
            showEditVehicleModal(vehicle);
        }
    });

    elements.vehicleSortBtn.addEventListener('click', () => {
        currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
        console.log(`Vehicle sort order changed to: ${currentSortOrder}`);
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
            .then(data => showMessage(data.message, data.success));
        }
    });

    App.loadVehicles = () => {
        populateGarageDropdown(elements.vehicleGarageSelect);
        loadVehicles();
    };
};