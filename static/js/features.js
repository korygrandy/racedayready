import {
    featureRequestForm,
    featureRequestTextarea,
    submitFeatureRequestBtn,
    charCounter,
    featureRequestList
} from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

/**
 * Deletes a feature request after user confirmation.
 * @param {string} requestId - The ID of the feature request to delete.
 */
const deleteFeatureRequest = (requestId) => {
    showConfirmationModal(
        'Are you sure you want to permanently delete this feature request?',
        () => {
            console.log(`Confirmed deletion for feature request ID: ${requestId}`);
            fetch(`/delete-feature-request/${requestId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                showMessage(data.message, data.success);
                if (data.success) {
                    loadFeatureRequests();
                }
            })
            .catch(error => {
                console.error('Error deleting feature request:', error);
                showMessage('Failed to delete request.', false);
            });
        }
    );
};

/**
 * Loads and displays all existing feature requests from the backend.
 */
export const loadFeatureRequests = () => {
    console.log("Loading feature requests...");
    fetch('/get-feature-requests')
        .then(response => response.json())
        .then(data => {
            featureRequestList.innerHTML = '';
            if (data.success) {
                // Handle submission form state
                if (data.limit_reached) {
                    featureRequestTextarea.disabled = true;
                    submitFeatureRequestBtn.disabled = true;
                    submitFeatureRequestBtn.textContent = 'Request Limit Reached';
                    featureRequestTextarea.placeholder = 'The maximum number of feature requests has been submitted.';
                } else {
                    featureRequestTextarea.disabled = false;
                    submitFeatureRequestBtn.disabled = false;
                    submitFeatureRequestBtn.textContent = 'Submit Request';
                    featureRequestTextarea.placeholder = 'Describe your feature idea...';
                }

                // Render list
                if (data.requests.length > 0) {
                    data.requests.forEach(req => {
                        const reqElement = document.createElement('div');
                        reqElement.className = 'bg-card-darker p-4 rounded-lg flex justify-between items-start';

                        const textContainer = document.createElement('div');
                        textContainer.innerHTML = `<p class="text-text-primary">${req.requestText}</p><p class="text-sm text-text-secondary mt-2">- ${req.username}</p>`;
                        reqElement.appendChild(textContainer);

                        if (App.isDevModeEnabled && data.deletion_enabled) {
                            const deleteButton = document.createElement('button');
                            deleteButton.innerHTML = '&times;';
                            deleteButton.className = 'ml-4 text-red-500 hover:text-red-400 font-bold text-2xl px-2 leading-none';
                            deleteButton.title = 'Delete Request';
                            deleteButton.onclick = () => deleteFeatureRequest(req.id);
                            reqElement.appendChild(deleteButton);
                        }

                        featureRequestList.appendChild(reqElement);
                    });
                } else {
                    featureRequestList.innerHTML = '<p class="text-text-secondary">No feature requests submitted yet.</p>';
                }
            }
        });
};

/**
 * Initializes event listeners for the feature request form.
 */
export const initFeatures = () => {
    featureRequestTextarea.addEventListener('input', () => {
        const currentLength = featureRequestTextarea.value.length;
        charCounter.textContent = `${currentLength} / 500`;
    });

    featureRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("Click Event: 'Submit Feature Request' button clicked.");
        const requestText = featureRequestTextarea.value.trim();
        if (!requestText || !App.currentUser) {
            showMessage('Cannot submit an empty request.', false);
            return;
        }

        submitFeatureRequestBtn.disabled = true;
        submitFeatureRequestBtn.textContent = 'Submitting...';

        fetch('/submit-feature-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: App.currentUser.username, requestText: requestText }),
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                featureRequestTextarea.value = '';
                charCounter.textContent = '0 / 500';
                loadFeatureRequests();
            }
        })
        .catch(error => {
            console.error('Error submitting feature request:', error);
            showMessage('Failed to submit request.', false);
        })
        .finally(() => {
            // The button's state will be correctly set by the next loadFeatureRequests() call
        });
    });
};