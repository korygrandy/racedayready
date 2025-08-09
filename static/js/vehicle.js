import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let currentVehicles = [];
let vehicleToEdit = null;

const populateYearDropdown = (selectElement) => {
    const currentYear = new Date().getFullYear();
    selectElement.innerHTML = '<option value="">Select Year</option>';
    for (let year = currentYear; year >= 1980; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    }
};

const populateMakeDropdown = async (selectElement) => {
    selectElement.disabled = true;
    selectElement.innerHTML = '<option>Loading Makes...</option>';
    try {
        const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
        const data = await response.json();
        selectElement.innerHTML = '<option value="">Select Make</option>';
        data.Results.forEach(make => {
            const option = document.createElement('option');
            option.value = make.Make_Name;
            option.textContent = make.Make_Name;
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    } catch (error) {
        console.error("Error fetching vehicle makes:", error);
        showMessage("Could not load vehicle makes.", false);
    }
};

const populateModelDropdown = async (make, selectElement) => {
    if (!make) {
        selectElement.innerHTML = '<option value="">Select Model</option>';
        selectElement.disabled = true;
        return;
    }
    selectElement.disabled = true;
    selectElement.innerHTML = '<option>Loading Models...</option>';
    try {
        const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${make}?format=json`);
        const data = await response.json();
        selectElement.innerHTML = '<option value="">Select Model</option>';
        data.Results.forEach(model => {
            const option = document.createElement('option');
            option.value = model.Model_Name;
            option.textContent = model.Model_Name;
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    } catch (error) {
        console.error("Error fetching vehicle models:", error);
        showMessage("Could not load vehicle models.", false);
    }
};

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
    await populateMakeDropdown(elements.editVehicleMakeSelect);
    elements.editVehicleMakeSelect.value = vehicle.make;
    await populateModelDropdown(vehicle.make, elements.editVehicleModelSelect);
    elements.editVehicleModelSelect.value = vehicle.model;
    await populateGarageDropdown(elements.editVehicleGarageSelect);
    elements.editVehicleGarageSelect.value = vehicle.garageId;

    if (vehicle.photo) {
        elements.editVehiclePhotoPreview.src = vehicle.photo;
        elements.editVehiclePhotoPreview.classList.remove('hidden');
    } else {
        elements.editVehiclePhotoPreview.classList.add('hidden');
    }

    elements.editVehicleModal.classList.remove('hidden');
};

const renderVehicles = () => {
    elements.vehicleList.innerHTML = '';
    if (currentVehicles.length === 0) {
        elements.vehicleList.innerHTML = '<p class="text-text-secondary">No vehicles added yet.</p>';
        return;
    }

    currentVehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'bg-card-darker p-4 rounded-lg flex items-center justify-between';

        const photo = vehicle.photo ? `<img src="${vehicle.photo}" class="w-16 h-16 object-cover rounded-md mr-4">` : '<div class="w-16 h-16 bg-input rounded-md mr-4"></div>';

        const details = `
            <div>
                <h3 class="font-bold text-lg">${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                <p class="text-sm text-text-secondary">Garage: ${vehicle.garageId || 'N/A'}</p>
            </div>
        `;

        const buttons = `
            <div class="flex space-x-2">
                <button class="edit-vehicle-btn px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm" data-id="${vehicle.id}">Edit</button>
                <button class="delete-vehicle-btn px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-500 text-sm" data-id="${vehicle.id}">Delete</button>
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

    const handlePhotoInput = (input, preview) => {
        const file = input.files[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                showMessage('Image size must be less than 500KB.', false);
                input.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };

    elements.vehiclePhotoInput.addEventListener('change', () => handlePhotoInput(elements.vehiclePhotoInput, elements.vehiclePhotoPreview));
    elements.editVehiclePhotoInput.addEventListener('change', () => handlePhotoInput(elements.editVehiclePhotoInput, elements.editVehiclePhotoPreview));

    elements.addVehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const vehicleData = {
            year: elements.vehicleYearSelect.value,
            make: elements.vehicleMakeSelect.value,
            model: elements.vehicleModelSelect.value,
            garageId: elements.vehicleGarageSelect.value,
            photo: elements.vehiclePhotoPreview.src.startsWith('data:') ? elements.vehiclePhotoPreview.src : null
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
        };
        if (elements.editVehiclePhotoPreview.src.startsWith('data:')) {
            vehicleData.photo = elements.editVehiclePhotoPreview.src;
        }

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

    App.loadVehicles = () => {
        populateGarageDropdown(elements.vehicleGarageSelect);
        loadVehicles();
    };
};