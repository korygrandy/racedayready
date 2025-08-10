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
        const checklistCard = document.createElement('div');
        checklistCard.className = 'bg-card-darker p-4 rounded-lg';
        checklistCard.innerHTML = `
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-lg">${checklist.name}</h3>
                <div class="flex space-x-2">
                    <button class="edit-checklist-btn text-sm" data-id="${checklist.id}">Edit</button>
                    <button class="delete-checklist-btn text-sm text-red-500" data-id="${checklist.id}">Delete</button>
                </div>
            </div>
        `;
        elements.checklistList.appendChild(checklistCard);
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
            }
        });
};

const renderTasks = (container, tasks) => {
    container.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'flex items-center justify-between bg-input p-2 rounded';
        taskElement.innerHTML = `
            <span>${task}</span>
            <button type="button" class="delete-task-btn text-red-500" data-index="${index}">&times;</button>
        `;
        container.appendChild(taskElement);
    });
};

const showEditChecklistModal = (checklist) => {
    checklistToEdit = checklist;
    elements.editChecklistTitle.textContent = `Edit: ${checklist.name}`;
    elements.editChecklistNameInput.value = checklist.name;

    renderTasks(elements.editPreRaceTasks, checklist.pre_race_tasks || []);
    renderTasks(elements.editMidDayTasks, checklist.mid_day_tasks || []);
    renderTasks(elements.editPostRaceTasks, checklist.post_race_tasks || []);

    elements.editChecklistModal.classList.remove('hidden');
};

export const initChecklists = () => {
    elements.addChecklistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const checklistData = { name: elements.checklistNameInput.value };
        fetch(`/add-checklist/${App.currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checklistData)
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if(data.success) {
                elements.addChecklistForm.reset();
                loadChecklists();
            }
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
                        loadChecklists();
                    });
            });
        } else if (button.classList.contains('edit-checklist-btn')) {
            showEditChecklistModal(checklist);
        }
    });

    elements.backToPrepFromChecklistsBtn.addEventListener('click', () => {
        App.setView('raceDayPrep');
    });

    elements.cancelEditChecklistBtn.addEventListener('click', () => {
        elements.editChecklistModal.classList.add('hidden');
    });

    const addTaskHandler = (input, container, key) => {
        const taskText = input.value.trim();
        if (taskText) {
            checklistToEdit[key].push(taskText);
            renderTasks(container, checklistToEdit[key]);
            input.value = '';
        }
    };

    elements.addPreRaceTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTaskHandler(elements.addPreRaceTaskInput, elements.editPreRaceTasks, 'pre_race_tasks');
        }
    });
    elements.addMidDayTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTaskHandler(elements.addMidDayTaskInput, elements.editMidDayTasks, 'mid_day_tasks');
        }
    });
    elements.addPostRaceTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTaskHandler(elements.addPostRaceTaskInput, elements.editPostRaceTasks, 'post_race_tasks');
        }
    });

    elements.editChecklistModal.addEventListener('click', (e) => {
        if(e.target.classList.contains('delete-task-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            const container = e.target.parentElement.parentElement;
            const key = container.id.replace('edit-', '').replace('-tasks', '_tasks');
            checklistToEdit[key].splice(index, 1);
            renderTasks(container, checklistToEdit[key]);
        }
    });

    elements.editChecklistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        checklistToEdit.name = elements.editChecklistNameInput.value;
        fetch(`/update-checklist/${App.currentUser.id}/${checklistToEdit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checklistToEdit),
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message, data.success);
            if (data.success) {
                elements.editChecklistModal.classList.add('hidden');
                loadChecklists();
            }
        });
    });

    App.loadChecklists = loadChecklists;
};