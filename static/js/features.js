import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let existingRequests = [];

const renderFeatureRequests = (requests, deletionEnabled) => {
    elements.featureRequestList.innerHTML = '';
    if (requests.length === 0) {
        elements.featureRequestList.innerHTML = '<p class="text-text-secondary">No feature requests submitted yet.</p>';
        return;
    }
    requests.forEach(request => {
        const requestEl = document.createElement('div');
        requestEl.className = 'bg-card-darker p-4 rounded-lg';

        let deleteButtonHtml = '';
        if (deletionEnabled) {
            deleteButtonHtml = `<button class="delete-request-btn text-red-500 hover:text-red-400 text-sm" data-id="${request.id}">Delete</button>`;
        }

        requestEl.innerHTML = `
            <div class="flex justify-between items-start">
                <p class="text-text-primary">${request.requestText}</p>
                ${deleteButtonHtml}
            </div>
            <p class="text-xs text-text-secondary mt-2">Submitted by: ${request.username}</p>
        `;
        elements.featureRequestList.appendChild(requestEl);
    });
};

export const loadFeatureRequests = () => {
    if (!App.currentUser) return;

    fetch('/get-feature-requests')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                existingRequests = data.requests;
                renderFeatureRequests(data.requests, data.deletion_enabled);
                elements.submitFeatureRequestBtn.disabled = data.limit_reached;
                elements.submitFeatureRequestBtn.textContent = data.limit_reached ? 'Request Limit Reached' : 'Submit Request';
            } else {
                showMessage('Could not load feature requests.', false);
            }
        })
        .catch(error => console.error('[ERROR] Error loading feature requests:', error));
};

export const initFeatures = () => {
    elements.featureRequestTextarea.addEventListener('input', () => {
        const count = elements.featureRequestTextarea.value.length;
        elements.charCounter.textContent = `${count} / 500`;
    });

    elements.featureRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const requestText = elements.featureRequestTextarea.value.trim();
        if (!requestText) {
            showMessage('Please enter your feature request.', false);
            return;
        }

        fetch('/submit-feature-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: App.currentUser.username,
                requestText: requestText,
            }),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.featureRequestTextarea.value = '';
                elements.charCounter.textContent = '0 / 500';
                loadFeatureRequests();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error submitting feature request:', error);
            showMessage('Failed to submit feature request.', false);
        });
    });

    elements.featureRequestList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-request-btn')) {
            const requestId = e.target.dataset.id;
            const request = existingRequests.find(r => r.id === requestId);
            showConfirmationModal(`Are you sure you want to delete the request from ${request.username}?`, () => {
                fetch(`/delete-feature-request/${requestId}`, {
                    method: 'DELETE',
                })
                .then(res => res.json())
                .then(data => {
                    showMessage(data.message, data.success);
                    if (data.success) {
                        loadFeatureRequests();
                    }
                })
                .catch(error => {
                    console.error('[ERROR] Error deleting feature request:', error);
                    showMessage('Failed to delete feature request.', false);
                });
            });
        }
    });
};