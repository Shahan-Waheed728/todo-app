const API = "http://localhost:5000";
let allTodos = [];
let currentFilter = 'all';

window.onload = () => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    document.getElementById('today-date').textContent =
        `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
    fetchTodos();
};

function fetchTodos() {
    fetch(`${API}/todos`)
        .then(res => res.json())
        .then(todos => {
            allTodos = todos;
            renderTodos();
            updateStats();
        })
        .catch(err => console.error('Fetch error:', err));
}

function renderTodos() {
    const list = document.getElementById('todoList');
    const empty = document.getElementById('emptyState');
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = allTodos.filter(todo => {
        const matchSearch = todo.task.toLowerCase().includes(search);
        if (currentFilter === 'all')     return matchSearch;
        if (currentFilter === 'pending') return matchSearch && !todo.done;
        if (currentFilter === 'done')    return matchSearch && todo.done;
        if (currentFilter === 'high')    return matchSearch && todo.priority === 'high';
        if (currentFilter === 'medium')  return matchSearch && todo.priority === 'medium';
        if (currentFilter === 'low')     return matchSearch && todo.priority === 'low';
        return matchSearch;
    });

    if (filtered.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    filtered.forEach(todo => {
        const priority = todo.priority || 'medium';
        const created  = todo.created_at || '';
        const div = document.createElement('div');
        div.className = `task priority-${priority} ${todo.done ? 'done-task' : ''}`;
        div.innerHTML = `
            <div class="check ${todo.done ? 'checked' : ''}">
                ${todo.done ? '&#10003;' : ''}
            </div>
            <div class="task-body">
                <div class="task-name ${todo.done ? 'done' : ''}">${todo.task}</div>
                <div class="task-meta">
                    <span class="badge badge-${priority}">
                        ${priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                    <span class="task-date">${created}</span>
                    ${todo.done ? '<span class="done-badge">Completed</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-sm" onclick="markDone(${todo.id})" ${todo.done ? 'disabled' : ''}>
                    Done
                </button>
                <button class="btn-sm btn-del" onclick="deleteTask(${todo.id})">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function updateStats() {
    const total   = allTodos.length;
    const done    = allTodos.filter(t => t.done).length;
    const pending = total - done;
    const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('totalCount').textContent   = total;
    document.getElementById('doneCount').textContent    = done;
    document.getElementById('pendingCount').textContent = pending;

    document.getElementById('bar-pending').style.width = total > 0 ? (pending / total * 100) + '%' : '0%';
    document.getElementById('bar-done').style.width    = total > 0 ? (done / total * 100) + '%' : '0%';

    document.getElementById('nav-all').textContent     = total;
    document.getElementById('nav-pending').textContent = pending;
    document.getElementById('nav-done').textContent    = done;

    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `${done} of ${total} done`;
}

function addTask() {
    const input    = document.getElementById('taskInput');
    const priority = document.getElementById('prioritySelect').value;
    const task     = input.value.trim();
    if (!task) return alert("Please enter a task!");

    fetch(`${API}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, priority })
    })
    .then(res => res.json())
    .then(newTodo => {
        allTodos.unshift(newTodo);
        input.value = '';
        renderTodos();
        updateStats();
    })
    .catch(err => console.error('Add error:', err));
}

function markDone(id) {
    fetch(`${API}/todos/${id}`, { method: 'PUT' })
        .then(res => res.json())
        .then(() => {
            fetchTodos();
        })
        .catch(err => console.error('Done error:', err));
}

function deleteTask(id) {
    fetch(`${API}/todos/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            fetchTodos();
        })
        .catch(err => console.error('Delete error:', err));
}

function setFilter(filter, el) {
    currentFilter = filter;
    document.querySelectorAll('.pill, .nav-item').forEach(e => e.classList.remove('active'));
    if (el) el.classList.add('active');
    renderTodos();
}