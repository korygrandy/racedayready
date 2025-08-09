import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let currentVehicles = [];

const populateYearDropdown = () => {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1980; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.vehicleYearSelect.appendChild(option);
    }
};

const populateMakeDropdown = async () => {
    elements.vehicleMakeSelect.disabled = true;
    elements.vehicleMakeSelect.innerHTML = '<option>Loading Makes...</option>';
    try {
        const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
        const data = await response.json();
        elements.vehicleMakeSelect.innerHTML = '<option value="">Select Make</option>';
        data.Results.forEach(make => {
            const option = document.createElement('option');
            option.value = make.Make_Name;
            option.textContent = make.Make_Name;
            elements.vehicleMakeSelect.appendChild(option);
        });
        elements.vehicleMakeSelect.disabled = false;
    } catch (error) {
        console.error("Error fetching vehicle makes:", error);
        showMessage("Could not load vehicle makes.", false);
    }
};

const populateModelDropdown = async (make) => {
    if (!make) {
        elements.vehicleModelSelect.innerHTML = '<option value="">Select Model</option>';
        elements.vehicleModelSelect.disabled = true;
        return;
    }
    elements.vehicleModelSelect.disabled = true;
    elements.vehicleModelSelect.innerHTML = '<option>Loading Models...</option>';
    try {
        const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${make}?format=json`);
        const data = await response.json();
        elements.vehicleModelSelect.innerHTML = '<option value="">Select Model</option>';
        data.Results.forEach(model => {
            const option = document.createElement('option');
            option.value = model.Model_Name;
            option.textContent = model.Model_Name;
            elements.vehicleModelSelect.appendChild(option);
        });
        elements.vehicleModelSelect.disabled = false;
    } catch (error) {
        console.error("Error fetching vehicle models:", error);
        showMessage("Could not load vehicle models.", false);
    }
};

const populateGarageDropdown = async () => {
    try {
        const response = await fetch(`/get-garages/${App.currentUser.id}`);
        const data = await response.json();
        elements.vehicleGarageSelect.innerHTML = '<option value="">No Garage</option>';
        if (data.success && data.garages.length > 0) {
            data.garages.forEach(garage => {
                const option = document.createElement('option');
                option.value = garage.id;
                option.textContent = garage.name;
                elements.vehicleGarageSelect.appendChild(option);
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
                <button class="edit-vehicle-btn" data-id="${vehicle.id}">Edit</button>
                <button class="delete-vehicle-btn" data-id="${vehicle.id}">Delete</button>
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
    populateYearDropdown();
    populateMakeDropdown();

    elements.vehicleMakeSelect.addEventListener('change', (e) => {
        populateModelDropdown(e.target.value);
    });

    elements.vehiclePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                showMessage('Image size must be less than 500KB.', false);
                elements.vehiclePhotoInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                elements.vehiclePhotoPreview.src = event.target.result;
                elements.vehiclePhotoPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

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

    elements.backToFeaturesFromVehicleBtn.addEventListener('click', () => {
        App.setView('features');
    });

    // Event delegation for edit/delete buttons
    elements.vehicleList.addEventListener('click', (e) => {
        const vehicleId = e.target.dataset.id;
        if (!vehicleId) return;

        if (e.target.classList.contains('delete-vehicle-btn')) {
            showConfirmationModal('Are you sure you want to delete this vehicle?', () => {
                fetch(`/delete-vehicle/${App.currentUser.id}/${vehicleId}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        showMessage(data.message, data.success);
                        loadVehicles();
                    });
            });
        }
        // Add edit logic here in the future
    });

    App.loadVehicles = () => {
        populateGarageDropdown();
        loadVehicles();
    };
};