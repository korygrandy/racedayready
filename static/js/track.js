import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let currentTracks = [];
let trackToEdit = null;

const renderTracks = () => {
    elements.trackList.innerHTML = '';
    if (currentTracks.length === 0) {
        elements.trackList.innerHTML = '<p class="text-text-secondary">No tracks added yet.</p>';
        return;
    }

    currentTracks.forEach(track => {
        const trackCard = document.createElement('div');
        trackCard.className = 'bg-card-darker p-4 rounded-lg flex items-start justify-between';

        const photoHtml = (track.photo || track.photoURL)
            ? `<img src="${track.photo || track.photoURL}" class="w-24 h-24 object-cover rounded-md mr-4">`
            : '<div class="w-24 h-24 bg-input rounded-md mr-4 flex items-center justify-center text-text-secondary"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v4m0 0h-4m4 0l-5-5" /></svg></div>';

        const googleLinkHtml = track.google_url
            ? `<a href="${track.google_url}" target="_blank" class="text-blue-500 hover:underline text-sm">View on Map</a>`
            : '';

        const layoutLinkHtml = (track.layout_photo || track.layout_photoURL)
            ? `<a href="#" class="view-layout-link text-blue-500 hover:underline text-sm" data-id="${track.id}">View Track Layout</a>`
            : '';

        const isOwner = track.profileId === App.currentUser.id;
        const editButtonHtml = isOwner ? `<button class="edit-track-btn text-text-secondary hover:text-white" data-id="${track.id}" title="Edit Track"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>` : '';
        const deleteButtonHtml = isOwner ? `<button class="delete-track-btn text-red-500 hover:text-red-400" data-id="${track.id}" title="Delete Track"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>` : '';

        trackCard.innerHTML = `
            <div>
                <div class="flex">
                    ${photoHtml}
                    <div>
                        <h3 class="font-bold text-lg">${track.name}</h3>
                        <p class="text-sm text-text-secondary">${track.location}</p>
                        <p class="text-sm text-text-secondary capitalize">${track.type}</p>
                        ${googleLinkHtml}
                        ${layoutLinkHtml}
                    </div>
                </div>
                <div class="track-layout-container hidden mt-4">
                    <img src="${track.layout_photo || track.layout_photoURL}" class="max-w-full h-auto rounded-lg">
                </div>
            </div>
            <div class="flex flex-col items-end space-y-2">
                ${editButtonHtml}
                ${deleteButtonHtml}
            </div>
        `;
        elements.trackList.appendChild(trackCard);
    });
};

const loadTracks = () => {
    if (!App.currentUser) return;
    fetch('/get-all-tracks')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentTracks = data.tracks;
                renderTracks();
            }
        })
        .catch(error => console.error('[ERROR] Error loading tracks:', error));
};

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

const showEditTrackModal = (track) => {
    trackToEdit = track;
    elements.editTrackNameInput.value = track.name;
    elements.editTrackLocationInput.value = track.location;
    elements.editTrackTypeSelect.value = track.type;
    elements.editTrackGoogleUrlInput.value = track.google_url || '';
    elements.editTrackPhotoUrlInput.value = track.photoURL || '';
    elements.editTrackLayoutPhotoUrlInput.value = track.layout_photoURL || '';
    elements.editTrackPhotoPreview.src = track.photo || track.photoURL || '';
    elements.editTrackLayoutPhotoPreview.src = track.layout_photo || track.layout_photoURL || '';
    elements.editTrackPhotoPreview.classList.toggle('hidden', !elements.editTrackPhotoPreview.src);
    elements.editTrackLayoutPhotoPreview.classList.toggle('hidden', !elements.editTrackLayoutPhotoPreview.src);
    elements.editTrackModal.classList.remove('hidden');
};

export const initTrack = () => {
    elements.trackPhotoInput.addEventListener('change', () => handlePhotoInput(elements.trackPhotoInput, elements.trackPhotoUrlInput, elements.trackPhotoPreview));
    elements.trackPhotoUrlInput.addEventListener('input', () => {
        elements.trackPhotoInput.value = '';
        elements.trackPhotoPreview.src = elements.trackPhotoUrlInput.value;
        elements.trackPhotoPreview.classList.remove('hidden');
    });

    elements.trackLayoutPhotoInput.addEventListener('change', () => handlePhotoInput(elements.trackLayoutPhotoInput, elements.trackLayoutPhotoUrlInput, elements.trackLayoutPhotoPreview));
    elements.trackLayoutPhotoUrlInput.addEventListener('input', () => {
        elements.trackLayoutPhotoInput.value = '';
        elements.trackLayoutPhotoPreview.src = elements.trackLayoutPhotoUrlInput.value;
        elements.trackLayoutPhotoPreview.classList.remove('hidden');
    });

    elements.addTrackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const trackData = {
            name: elements.trackNameInput.value,
            location: elements.trackLocationInput.value,
            type: elements.trackTypeSelect.value,
            google_url: elements.trackGoogleUrlInput.value,
            photo: elements.trackPhotoPreview.src.startsWith('data:') ? elements.trackPhotoPreview.src : null,
            photoURL: elements.trackPhotoUrlInput.value || null,
            layout_photo: elements.trackLayoutPhotoPreview.src.startsWith('data:') ? elements.trackLayoutPhotoPreview.src : null,
            layout_photoURL: elements.trackLayoutPhotoUrlInput.value || null,
            profileId: App.currentUser.id,
        };

        fetch('/add-track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trackData),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.addTrackForm.reset();
                elements.trackPhotoPreview.classList.add('hidden');
                elements.trackLayoutPhotoPreview.classList.add('hidden');
                loadTracks();
            }
        })
        .catch(error => console.error('[ERROR] Error adding track:', error));
    });

    elements.editTrackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const trackData = {
            name: elements.editTrackNameInput.value,
            location: elements.editTrackLocationInput.value,
            type: elements.editTrackTypeSelect.value,
            google_url: elements.editTrackGoogleUrlInput.value,
            photo: elements.editTrackPhotoPreview.src.startsWith('data:') ? elements.editTrackPhotoPreview.src : null,
            photoURL: elements.editTrackPhotoUrlInput.value || null,
            layout_photo: elements.editTrackLayoutPhotoPreview.src.startsWith('data:') ? elements.editTrackLayoutPhotoPreview.src : null,
            layout_photoURL: elements.editTrackLayoutPhotoUrlInput.value || null,
            profileId: App.currentUser.id, // For ownership check
        };

        fetch(`/update-track/${trackToEdit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trackData),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.editTrackModal.classList.add('hidden');
                loadTracks();
            }
        })
        .catch(error => console.error('[ERROR] Error updating track:', error));
    });

    elements.trackList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        const layoutLink = e.target.closest('.view-layout-link');

        if (layoutLink) {
            e.preventDefault();
            const layoutContainer = e.target.closest('.bg-card-darker').querySelector('.track-layout-container');
            layoutContainer.classList.toggle('hidden');
        }

        if (!button) return;

        const trackId = button.dataset.id;
        const track = currentTracks.find(t => t.id === trackId);

        if (button.classList.contains('delete-track-btn')) {
            showConfirmationModal(`Are you sure you want to delete the track "${track.name}"?`, () => {
                fetch(`/delete-track/${trackId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileId: App.currentUser.id })
                })
                    .then(res => res.json())
                    .then(data => {
                        showMessage(data.message, data.success);
                        if(data.success) loadTracks();
                    })
                    .catch(error => console.error('[ERROR] Error deleting track:', error));
            });
        } else if (button.classList.contains('edit-track-btn')) {
            showEditTrackModal(track);
        }
    });

    elements.cancelEditTrackBtn.addEventListener('click', () => {
        elements.editTrackModal.classList.add('hidden');
    });

    elements.backToFeaturesFromTrackBtn.addEventListener('click', () => {
        App.setView('features');
    });

    App.loadTracks = loadTracks;
};
