document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('edit-task-modal');
  const form = document.getElementById('edit-task-form');
  const closeBtn = document.getElementById('close-modal');
  const taskList = document.querySelector('.task-list');

  if (!modal || !form || !taskList) {
    console.error('Required elements not found (modal/form/task-list).');
    return;
  }

  let currentTask = null;


  taskList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (!editBtn) return;

    const taskEl = editBtn.closest('.task');
    if (!taskEl) return;

    currentTask = taskEl;

    const title = taskEl.querySelector('h3')?.innerText.trim() ?? '';

    let body = '', priority = '', deadline = '';
    taskEl.querySelectorAll('p').forEach(p => {
      const txt = p.innerText.trim();
      const low = txt.toLowerCase();
      if (low.startsWith('deadline:')) deadline = txt.replace(/deadline:/i, '').trim();
      else if (low.startsWith('priority:')) priority = txt.replace(/priority:/i, '').trim();
      else if (low.startsWith('status:')) {  }
      else body = txt;
    });


    document.getElementById('edit-title').value = title;
    document.getElementById('edit-body').value = body;
    document.getElementById('edit-priority').value = (priority || 'MEDIUM').toUpperCase();


    const iso = parseToIsoDate(deadline);
    document.getElementById('edit-deadline').value = iso || '';

    modal.style.display = 'flex';
  });

  closeBtn?.addEventListener('click', () => { modal.style.display = 'none'; currentTask = null; });


  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      currentTask = null;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
      currentTask = null;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentTask) {
      modal.style.display = 'none';
      return;
    }

    const newTitle = document.getElementById('edit-title').value.trim();
    const newBody = document.getElementById('edit-body').value.trim();
    const newPriority = document.getElementById('edit-priority').value;
    const newDeadlineVal = document.getElementById('edit-deadline').value;

    const h3 = currentTask.querySelector('h3');
    if (h3) h3.innerText = newTitle;

    let pEls = Array.from(currentTask.querySelectorAll('p'));
    let bodyP = pEls.find(p => {
      const t = p.innerText.toLowerCase();
      return !t.startsWith('deadline:') && !t.startsWith('priority:') && !t.startsWith('status:');
    });
    if (bodyP) bodyP.innerText = newBody;
    else {
      const newP = document.createElement('p');
      newP.innerText = newBody;
      const actions = currentTask.querySelector('.task-actions');
      currentTask.insertBefore(newP, actions);
    }

    const deadlineP = pEls.find(p => p.innerText.toLowerCase().startsWith('deadline:'));
    if (newDeadlineVal) {
      const human = new Date(newDeadlineVal).toLocaleDateString();
      if (deadlineP) deadlineP.innerText = 'Deadline: ' + human;
      else {
        const newDP = document.createElement('p');
        newDP.innerText = 'Deadline: ' + new Date(newDeadlineVal).toLocaleDateString();
        const actions = currentTask.querySelector('.task-actions');
        currentTask.insertBefore(newDP, actions);
      }
    } else {
      if (deadlineP) deadlineP.remove();
    }

    const priorityP = pEls.find(p => p.innerText.toLowerCase().startsWith('priority:'));
    if (priorityP) priorityP.innerText = 'Priority: ' + newPriority;
    else {
      const newPr = document.createElement('p');
      newPr.innerText = 'Priority: ' + newPriority;
      const actions = currentTask.querySelector('.task-actions');
      currentTask.insertBefore(newPr, actions);
    }

    modal.style.display = 'none';
    currentTask = null;
  });

  function parseToIsoDate(str) {
    if (!str) return null;

    const d = new Date(str);
    if (!isNaN(d.valueOf())) return d.toISOString().split('T')[0];


    const m = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})/);
    if (m) {
      const day = String(m[1]).padStart(2, '0');
      const monthName = m[2].slice(0,3).toLowerCase();
      const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
      const mm = months[monthName];
      if (mm) return `${m[3]}-${mm}-${day}`;
    }
    return null;
  }
});

