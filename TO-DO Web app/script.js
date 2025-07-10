document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const taskDatetimeInput = document.getElementById('task-datetime');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const filterCategorySelect = document.getElementById('filter-category');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let categories = new Set(); // To store unique categories

    // Function to render tasks
    const renderTasks = (filter = 'all') => {
        taskList.innerHTML = ''; // Clear existing tasks

        // Filter tasks
        const filteredTasks = tasks.filter(task => {
            if (filter === 'all') {
                return true;
            } else if (filter === 'completed') {
                return task.completed;
            } else if (filter === 'pending') {
                return !task.completed;
            } else { // Custom category filter
                return task.category === filter;
            }
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id; // Store ID for easy lookup
            if (task.completed) {
                li.classList.add('completed');
            }

            const taskContent = document.createElement('div');
            taskContent.classList.add('task-content');

            const taskText = document.createElement('span');
            taskText.classList.add('task-text');
            taskText.textContent = task.text;

            const taskDetails = document.createElement('div');
            taskDetails.classList.add('task-details');
            if (task.datetime) {
                const date = new Date(task.datetime);
                taskDetails.textContent = `Due: ${date.toLocaleString()}`;
            }
            if (task.category) {
                taskDetails.textContent += (task.datetime ? ' | ' : 'Category: ') + `Category: ${task.category}`;
            }

            taskContent.appendChild(taskText);
            if (task.datetime || task.category) {
                taskContent.appendChild(taskDetails);
            }

            const taskActions = document.createElement('div');
            taskActions.classList.add('task-actions');

            const completeBtn = document.createElement('button');
            completeBtn.classList.add('complete-btn');
            completeBtn.innerHTML = task.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
            completeBtn.title = task.completed ? 'Mark as Pending' : 'Mark as Complete';
            completeBtn.addEventListener('click', () => toggleComplete(task.id));

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit Task';
            editBtn.addEventListener('click', () => editTask(task.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Delete Task';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskActions.appendChild(completeBtn);
            taskActions.appendChild(editBtn);
            taskActions.appendChild(deleteBtn);

            // Edit Input Group (initially hidden)
            const editInputGroup = document.createElement('div');
            editInputGroup.classList.add('edit-input-group');

            const editTextInput = document.createElement('input');
            editTextInput.type = 'text';
            editTextInput.value = task.text;

            const editDatetimeInput = document.createElement('input');
            editDatetimeInput.type = 'datetime-local';
            // Set initial datetime value if available
            if (task.datetime) {
                // Convert ISO string to local datetime format for input type="datetime-local"
                // Example: "2025-07-08T14:30"
                const date = new Date(task.datetime);
                editDatetimeInput.value = date.toISOString().slice(0, 16);
            }

            const editCategoryInput = document.createElement('input');
            editCategoryInput.type = 'text';
            editCategoryInput.placeholder = 'Category (optional)';
            editCategoryInput.value = task.category || '';


            const saveBtn = document.createElement('button');
            saveBtn.classList.add('save-btn');
            saveBtn.textContent = 'Save';
            saveBtn.addEventListener('click', () => saveTask(task.id, editTextInput.value, editDatetimeInput.value, editCategoryInput.value));

            editInputGroup.appendChild(editTextInput);
            editInputGroup.appendChild(editDatetimeInput);
            editInputGroup.appendChild(editCategoryInput);
            editInputGroup.appendChild(saveBtn);


            li.appendChild(taskContent);
            li.appendChild(editInputGroup); // Add edit input group to the list item
            li.appendChild(taskActions);
            taskList.appendChild(li);
        });
    };

    // Function to save tasks to local storage
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Function to add a new task
    const addTask = () => {
        const text = taskInput.value.trim();
        const datetime = taskDatetimeInput.value; // Will be empty string if not set

        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        let category = '';
        // Simple category detection: if input contains a hashtag, use it as category
        const hashtagMatch = text.match(/#(\w+)/);
        if (hashtagMatch) {
            category = hashtagMatch[1].toLowerCase();
            // Optionally remove the hashtag from the task text
            // text = text.replace(/#\w+\s*/, '').trim();
        }


        const newTask = {
            id: Date.now(), // Unique ID based on timestamp
            text: text,
            datetime: datetime,
            category: category,
            completed: false
        };

        tasks.push(newTask);
        categories.add(category); // Add new category to the set
        saveTasks();
        renderTasks(filterCategorySelect.value); // Re-render with current filter
        populateCategoriesFilter(); // Update category filter dropdown
        taskInput.value = ''; // Clear input
        taskDatetimeInput.value = ''; // Clear datetime input
    };

    // Function to toggle task completion status
    const toggleComplete = (id) => {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks(filterCategorySelect.value);
        }
    };

    // Function to enter edit mode
    const editTask = (id) => {
        const li = taskList.querySelector(`li[data-id="${id}"]`);
        if (li) {
            li.classList.add('editing'); // Add editing class
            const task = tasks.find(t => t.id === id);
            if (task) {
                const editTextInput = li.querySelector('.edit-input-group input[type="text"]');
                const editDatetimeInput = li.querySelector('.edit-input-group input[type="datetime-local"]');
                const editCategoryInput = li.querySelector('.edit-input-group input[type="text"]:last-of-type'); // Adjust selector for category input
                
                editTextInput.value = task.text;
                if (task.datetime) {
                    editDatetimeInput.value = new Date(task.datetime).toISOString().slice(0, 16);
                } else {
                    editDatetimeInput.value = '';
                }
                editCategoryInput.value = task.category || '';
                editTextInput.focus();
            }
        }
    };

    // Function to save edited task
    const saveTask = (id, newText, newDatetime, newCategory) => {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            if (newText.trim() === '') {
                alert('Task cannot be empty!');
                return;
            }

            tasks[taskIndex].text = newText.trim();
            tasks[taskIndex].datetime = newDatetime; // Empty string if not set
            tasks[taskIndex].category = newCategory.trim().toLowerCase(); // Save category

            saveTasks();
            renderTasks(filterCategorySelect.value); // Re-render after saving
            populateCategoriesFilter(); // Update category filter dropdown
        }
    };

    // Function to delete a task
    const deleteTask = (id) => {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks(filterCategorySelect.value);
            updateCategoriesFromTasks(); // Recalculate categories after deletion
        }
    };

    // Function to clear all completed tasks
    const clearCompletedTasks = () => {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks(filterCategorySelect.value);
            updateCategoriesFromTasks(); // Recalculate categories after clearing
        }
    };

    // Function to populate categories in the filter dropdown
    const populateCategoriesFilter = () => {
        filterCategorySelect.innerHTML = '<option value="all">All</option><option value="completed">Completed</option><option value="pending">Pending</option>';

        // Ensure categories are unique and sorted
        const sortedCategories = Array.from(categories).sort();

        sortedCategories.forEach(category => {
            if (category) { // Only add non-empty categories
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize first letter
                filterCategorySelect.appendChild(option);
            }
        });

        // Set the filter back to the currently selected one after re-populating
        if (filterCategorySelect.dataset.currentFilter) {
            filterCategorySelect.value = filterCategorySelect.dataset.currentFilter;
        }
    };

    // Function to update categories set based on current tasks
    const updateCategoriesFromTasks = () => {
        categories.clear();
        tasks.forEach(task => {
            if (task.category) {
                categories.add(task.category);
            }
        });
        populateCategoriesFilter();
    };

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    filterCategorySelect.addEventListener('change', (e) => {
        const selectedFilter = e.target.value;
        filterCategorySelect.dataset.currentFilter = selectedFilter; // Store current filter
        renderTasks(selectedFilter);
    });

    clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    // Initial load
    updateCategoriesFromTasks(); // Populate categories based on existing tasks
    renderTasks(); // Display tasks when the page loads
});