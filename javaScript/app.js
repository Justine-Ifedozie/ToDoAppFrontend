document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const closeBtn = document.getElementById('close-task-modal');
  const taskList = document.getElementById('task-list');
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskModalTitle = document.getElementById('task-modal-title');
  const taskIdInput = document.getElementById('task-id');
  const emptyState = document.createElement('div');

  emptyState.className = 'empty-state';
  emptyState.innerHTML = `
    <p>No tasks yet. Click <strong>+ Add Task</strong> to create one!</p>
  `;

  let user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'login.html';
    return;
  }


  function toggleEmptyState() {
    if (!taskList || taskList.children.length === 0) {
      if (!document.querySelector('.empty-state')) {
        taskList.parentNode.insertBefore(emptyState, taskList);
      }
    } else {
      const es = document.querySelector('.empty-state');
      if (es) es.remove();
    }
  }

  function formatDeadline(deadline) {
    if (!deadline) return 'No deadline';
    const d = new Date(deadline);
    return d.toLocaleString();
  }

  function createTaskElement(task) {
    const taskEl = document.createElement('div');
    taskEl.className = 'task';
    taskEl.dataset.id = task.id;

    taskEl.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.body || ''}</p>
      <p>Deadline: ${formatDeadline(task.deadline)}</p>
      <p>Priority: ${task.priority}</p>
      <p>Status: <span class="status ${task.completed ? 'completed' : 'pending'}">
        ${task.completed ? 'Completed' : 'Pending'}
      </span></p>
      <div class="task-actions">
        <button class="complete-btn">${task.completed ? 'Undo' : 'Mark as Completed'}</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    return taskEl;
  }

  async function loadTasks() {
    try {
      const res = await fetch(`/api/tasks/user/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const tasks = await res.json();
      taskList.innerHTML = '';
      tasks.forEach(task => {
        const el = createTaskElement(task);
        taskList.appendChild(el);
      });
      toggleEmptyState();
    } catch (err) {
      console.error(err);
    }
  }


  addTaskBtn.addEventListener('click', () => {
    form.reset();
    taskIdInput.value = '';
    taskModalTitle.textContent = 'Add Task';
    modal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = taskIdInput.value;
    const title = document.getElementById('task-title').value.trim();
    const body = document.getElementById('task-body').value.trim();
    const priority = document.getElementById('task-priority').value;
    const deadlineInput = document.getElementById('task-deadline').value;
    const deadline = deadlineInput ? new Date(deadlineInput).toISOString() : null;

    const payload = { userId: user.id, title, body, priority, deadline };

    try {
      let res;
      if (id) {

        res = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {

        res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Failed to save task');
      await loadTasks();
      modal.style.display = 'none';
    } catch (err) {
      console.error(err);
    }
  });


  taskList.addEventListener('click', async (e) => {
    const taskEl = e.target.closest('.task');
    if (!taskEl) return;
    const id = taskEl.dataset.id;


    if (e.target.classList.contains('delete-btn')) {
      try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) {
          taskEl.remove();
          toggleEmptyState();
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (e.target.classList.contains('complete-btn')) {
      try {
        const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PUT' });
        if (res.ok) {
          await loadTasks();
        }
      } catch (err) {
        console.error(err);
      }
    }


    if (e.target.classList.contains('edit-btn')) {
      const title = taskEl.querySelector('h3').innerText;
      const body = taskEl.querySelectorAll('p')[0]?.innerText || '';
      const priority = taskEl.querySelectorAll('p')[2]?.innerText.replace('Priority: ', '');
      const deadlineTxt = taskEl.querySelectorAll('p')[1]?.innerText.replace('Deadline: ', '').trim();

      document.getElementById('task-title').value = title;
      document.getElementById('task-body').value = body;
      document.getElementById('task-priority').value = priority.toUpperCase();
      document.getElementById('task-id').value = id;


      if (deadlineTxt && deadlineTxt !== 'No deadline') {
        const d = new Date(deadlineTxt);
        const localISO = d.toISOString().slice(0, 16); 
        document.getElementById('task-deadline').value = localISO;
      } else {
        document.getElementById('task-deadline').value = '';
      }

      taskModalTitle.textContent = 'Edit Task';
      modal.style.display = 'flex';
    }
  });


  loadTasks();
});

