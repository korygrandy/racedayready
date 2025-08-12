import { showMessage } from './ui.js';

/**
 * Debounce function to limit the rate at which a function gets called.
 * @param {function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {function} The debounced function.
 */
export const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Filters the options in a select dropdown based on user input.
 * @param {HTMLInputElement} input - The text input element for searching.
 * @param {HTMLSelectElement} select - The select dropdown to filter.
 */
export const filterDropdown = (input, select) => {
    const filter = input.value.toUpperCase();
    const options = select.getElementsByTagName('option');
    for (let i = 0; i < options.length; i++) {
        const txtValue = options[i].textContent || options[i].innerText;
        if (options[i].value === "" || txtValue.toUpperCase().indexOf(filter) > -1) {
            options[i].style.display = "";
        } else {
            options[i].style.display = "none";
        }
    }
};

/**
 * Populates a select dropdown with years from the current year down to 1980.
 * @param {HTMLSelectElement} selectElement - The <select> element to populate.
 */
export const populateYearDropdown = (selectElement) => {
    const currentYear = new Date().getFullYear();
    selectElement.innerHTML = '<option value="">Select Year</option>';
    for (let year = currentYear; year >= 1980; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    }
};

/**
 * Fetches and populates a select dropdown with vehicle makes from the NHTSA API.
 * @param {HTMLSelectElement} selectElement - The <select> element for vehicle makes.
 * @param {string|null} selectedMake - The make to pre-select.
 */
export const populateMakeDropdown = async (selectElement, selectedMake = null) => {
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
            if (selectedMake && make.Make_Name === selectedMake) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    } catch (error) {
        console.error("[ERROR] Error fetching vehicle makes:", error);
        showMessage("Could not load vehicle makes.", false);
        selectElement.innerHTML = '<option value="">Error loading makes</option>';
    }
};

/**
 * Fetches and populates a select dropdown with vehicle models for a given make.
 * @param {string} make - The selected vehicle make.
 * @param {HTMLSelectElement} selectElement - The <select> element for vehicle models.
 * @param {string|null} selectedModel - The model to pre-select.
 */
export const populateModelDropdown = async (make, selectElement, selectedModel = null) => {
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
            if (selectedModel && model.Model_Name === selectedModel) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    } catch (error) {
        console.error("[ERROR] Error fetching vehicle models:", error);
        showMessage("Could not load vehicle models.", false);
        selectElement.innerHTML = '<option value="">Error loading models</option>';
    }
};
