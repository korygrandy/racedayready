import * as elements from './elements.js';
import { showMessage, showConfirmationModal } from './ui.js';
import { App } from './main.js';

let currentChecklists = [];
let checklistToEdit = null;

const renderChecklists = () => {
    elements.checklistList.innerHTML = '';
    if (currentChecklists.length === 0) {
        elements.checklistList.innerHTML = '<p class="text-text-secondary">No checklist templates created yet.</p>';
        return;
    }
    currentChecklists.forEach(checklist => {
        const preRaceTasks = checklist.pre_race_tasks.length;
        const midDayTasks = checklist.mid_day_tasks.length;
        const postRaceTasks = checklist.post_race_tasks.length;
        const totalTasks = preRaceTasks + midDayTasks + postRaceTasks;

        const card = document.createElement('div');
        card.className = 'bg-card-darker p-4 rounded-lg';
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg">${checklist.name}</h3>
                    <p class="text-sm text-text-secondary">${totalTasks} total tasks</p>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="edit-checklist-btn text-text-secondary hover:text-white" data-id="${checklist.id}" title="Edit Checklist">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    </button>
                    <button class="delete-checklist-btn text-red-500 hover:text-red-400" data-id="${checklist.id}" title="Delete Checklist">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        `;
        elements.checklistList.appendChild(card);
    });
};

const loadChecklists = () => {
    if (!App.currentUser) return;
    fetch(`/get-checklists/${App.currentUser.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentChecklists = data.checklists;
                renderChecklists();
            } else {
                showMessage('Could not load checklists.', false);
            }
        })
        .catch(error => console.error('[ERROR] Error loading checklists:', error));
};

const renderTaskItems = (container, tasks) => {
    container.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskEl = document.createElement('div');
        taskEl.className = 'flex items-center justify-between bg-input p-2 rounded';
        taskEl.innerHTML = `
            <span>${task}</span>
            <button type="button" class="delete-task-btn text-red-500 hover:text-red-400" data-index="${index}">&times;</button>
        `;
        container.appendChild(taskEl);
    });
};

const showEditChecklistModal = (checklist) => {
    checklistToEdit = checklist;
    console.log("[INFO] Showing edit checklist modal for:", checklist.name);
    elements.editChecklistTitle.textContent = `Edit "${checklist.name}"`;
    elements.editChecklistNameInput.value = checklist.name;

    renderTaskItems(elements.editPreRaceTasks, checklist.pre_race_tasks);
    renderTaskItems(elements.editMidDayTasks, checklist.mid_day_tasks);
    renderTaskItems(elements.editPostRaceTasks, checklist.post_race_tasks);

    elements.editChecklistModal.classList.remove('hidden');
};

export const initChecklists = () => {
    elements.addChecklistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = elements.checklistNameInput.value;
        if (!name) {
            showMessage('Checklist name is required.', false);
            return;
        }

        fetch(`/add-checklist/${App.currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.addChecklistForm.reset();
                loadChecklists();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error adding checklist:', error);
            showMessage('Failed to add checklist.', false);
        });
    });

    elements.checklistList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const checklistId = button.dataset.id;
        const checklist = currentChecklists.find(c => c.id === checklistId);

        if (button.classList.contains('delete-checklist-btn')) {
            showConfirmationModal(`Are you sure you want to delete the checklist "${checklist.name}"?`, () => {
                fetch(`/delete-checklist/${App.currentUser.id}/${checklistId}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        showMessage(data.message, data.success);
                        if(data.success) loadChecklists();
                    })
                    .catch(error => {
                        console.error('[ERROR] Error deleting checklist:', error);
                        showMessage('Failed to delete checklist.', false);
                    });
            });
        } else if (button.classList.contains('edit-checklist-btn')) {
            showEditChecklistModal(checklist);
        }
    });

    elements.editChecklistForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const updatedChecklist = {
            name: elements.editChecklistNameInput.value,
            pre_race_tasks: Array.from(elements.editPreRaceTasks.querySelectorAll('span')).map(span => span.textContent),
            mid_day_tasks: Array.from(elements.editMidDayTasks.querySelectorAll('span')).map(span => span.textContent),
            post_race_tasks: Array.from(elements.editPostRaceTasks.querySelectorAll('span')).map(span => span.textContent),
        };

        fetch(`/update-checklist/${App.currentUser.id}/${checklistToEdit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedChecklist),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.editChecklistModal.classList.add('hidden');
                loadChecklists();
            }
        })
        .catch(error => {
            console.error('[ERROR] Error updating checklist:', error);
            showMessage('Failed to update checklist.', false);
        });
    });

    const setupTaskInputs = (input, container, taskArray) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const taskText = input.value.trim();
                if (taskText) {
                    taskArray.push(taskText);
                    renderTaskItems(container, taskArray);
                    input.value = '';
                }
            }
        });
    };

    setupTaskInputs(elements.addPreRaceTaskInput, elements.editPreRaceTasks, checklistToEdit ? checklistToEdit.pre_race_tasks : []);
    setupTaskInputs(elements.addMidDayTaskInput, elements.editMidDayTasks, checklistToEdit ? checklistToEdit.mid_day_tasks : []);
    setupTaskInputs(elements.addPostRaceTaskInput, elements.editPostRaceTasks, checklistToEdit ? checklistToEdit.post_race_tasks : []);

    elements.editChecklistModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-task-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            const container = e.target.closest('div.space-y-2');
            let taskArray;
            if (container.id === 'edit-pre-race-tasks') taskArray = checklistToEdit.pre_race_tasks;
            if (container.id === 'edit-mid-day-tasks') taskArray = checklistToEdit.mid_day_tasks;
            if (container.id === 'edit-post-race-tasks') taskArray = checklistToEdit.post_race_tasks;

            taskArray.splice(index, 1);
            renderTaskItems(container, taskArray);
        }
    });

    elements.cancelEditChecklistBtn.addEventListener('click', () => {
        elements.editChecklistModal.classList.add('hidden');
    });

    elements.backToPrepFromChecklistsBtn.addEventListener('click', () => {
        App.setView('raceDayPrep');
    });

    App.loadChecklists = loadChecklists;
};