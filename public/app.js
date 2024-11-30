document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T');
  document.getElementById('due_date').setAttribute('min', today[0]);
  document.getElementById('editDueDate').setAttribute('min', today[0]);
});

document.getElementById('taskForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const due_date = document.getElementById('due_date').value;
  const due_time = document.getElementById('due_time').value;
  const status = document.getElementById('status').value;

  // Validation
  if (!title) {
    alert('Title is required');
    return;
  }
  if (!description) {
    alert('Description is required');
    return;
  }
  if (!due_date) {
    alert('Due date is required');
    return;
  }
  if (!due_time) {
    alert('Due time is required');
    return;
  }

  const response = await fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, due_date, due_time, status }),
  });

  if (response.ok) {
    loadTasks();
    document.getElementById('taskForm').reset();
  } else {
    alert('Error adding task');
  }
});

async function loadTasks() {
  const filterStatus = document.getElementById('statusFilter').value;
  const url = filterStatus ? `/tasks?status=${filterStatus}` : '/tasks';
  const response = await fetch(url);
  const tasks = await response.json();
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  tasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task');
    taskElement.innerHTML = `
      <div class="task-info">
        <h3>${task.title} - <strong>${task.status}</strong></h3>
        <p>${task.description}</p>
        <div>Due Date: ${task.due_date} ${task.due_time}</div>
        <div>Created At: ${new Date(task.created_at).toLocaleString()}</div>
        ${task.completed_at ? `<div>Completed At: ${new Date(task.completed_at).toLocaleString()}</div>` : ''}
      </div>
      <div class="task-actions">
        <button onclick="showEditModal(${task.id})">Edit</button>
        <button onclick="deleteTask(${task.id})">Delete</button>
        <button onclick="toggleStatus(${task.id}, '${task.status}')">Change Status</button>
      </div>
    `;
    taskList.appendChild(taskElement);
  });
}

function showEditModal(id) {
  fetch(`/tasks/${id}`)
    .then(response => response.json())
    .then(task => {
      document.getElementById('editTitle').value = task.title;
      document.getElementById('editDescription').value = task.description;
      document.getElementById('editDueDate').value = task.due_date;
      document.getElementById('editDueTime').value = task.due_time;
      document.getElementById('editStatus').value = task.status;
      document.getElementById('editForm').onsubmit = (event) => {
        event.preventDefault();
        editTask(id);
      };
      document.getElementById('editTaskModal').style.display = 'block';
    });
}

function closeEditModal() {
  document.getElementById('editTaskModal').style.display = 'none';
}

async function editTask(id) {
  const title = document.getElementById('editTitle').value.trim();
  const description = document.getElementById('editDescription').value.trim();
  const due_date = document.getElementById('editDueDate').value;
  const due_time = document.getElementById('editDueTime').value;
  const status = document.getElementById('editStatus').value;

  if (!title) {
    alert('Title is required');
    return;
  }
  if (!description) {
    alert('Description is required');
    return;
  }
  if (!due_date) {
    alert('Due date is required');
    return;
  }
  if (!due_time) {
    alert('Due time is required');
    return;
  }

  const response = await fetch(`/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, due_date, due_time, status }),
  });

  if (response.ok) {
    alert('Task updated successfully');
    loadTasks();
    closeEditModal();
  } else {
    alert('Error updating task');
  }
}

async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';

  const response = await fetch(`/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });

  if (response.ok) {
    alert(`Task status updated to ${newStatus}`);
    loadTasks();
  } else {
    alert('Error updating task status');
  }
}

async function deleteTask(id) {
  const confirmation = confirm('Are you sure you want to delete this task?');
  if (confirmation) {
    const response = await fetch(`/tasks/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      loadTasks();
    } else {
      alert('Error deleting task');
    }
  }
}

loadTasks();
