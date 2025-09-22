// tasks.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:8080/api/tasks";
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const taskList = document.getElementById("task-list");
  const modal = document.getElementById("task-modal");
  const form = document.getElementById("task-form");
  const closeBtn = document.getElementById("close-task-modal");
  const addBtn = document.getElementById("add-task-btn");
  const modalTitle = document.getElementById("task-modal-title");
  const taskIdInput = document.getElementById("task-id");

  // Toast container
  const toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  document.body.appendChild(toastContainer);

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 500);
    }, 2200);
  }

  // defensive HTML escape to avoid XSS from server data
  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Fetch tasks (no-cache)
  async function fetchTasks() {
    try {
      const res = await fetch(`${API_BASE}/user/${encodeURIComponent(user.id)}?_=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load tasks");
      const tasks = await res.json();
      console.debug("fetchTasks -> tasks:", tasks); // useful for debugging
      renderTasks(Array.isArray(tasks) ? tasks : []);
    } catch (err) {
      console.error("fetchTasks error:", err);
      showToast("Error loading tasks", "error");
    }
  }

  // render list or empty state
  function renderTasks(tasks) {
    taskList.innerHTML = "";
    if (!tasks || tasks.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.innerHTML = `<p>No tasks yet. Click <strong>+ Add Task</strong> to create one.</p>`;
      taskList.appendChild(emptyState);
      return;
    }
    tasks.forEach(renderTask);
  }

  // render single task; coerce completed boolean robustly
  function renderTask(task) {
    const completed = (task.completed === true) || (String(task.completed) === "true") || Number(task.completed) === 1;
    const title = escapeHtml(task.title || "Untitled");
    const body = escapeHtml(task.body || "");
    const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A";
    const priority = escapeHtml(task.priority || "MEDIUM");

    const taskEl = document.createElement("div");
    taskEl.classList.add("task");
    taskEl.dataset.id = task.id;

    const completeBtnHtml = completed ? "" : `<button class="complete-btn">Mark as Completed</button>`;

    taskEl.innerHTML = `
      <h3>${title}</h3>
      <p>${body}</p>
      <p>Deadline: ${escapeHtml(deadline)}</p>
      <p>Priority: ${priority}</p>
      <p>Status: <span class="status ${completed ? "completed" : "pending"}">${completed ? "Completed" : "Pending"}</span></p>
      <div class="task-actions">
        ${completeBtnHtml}
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // subtle visual change for completed tasks
    if (completed) {
      taskEl.style.opacity = "0.7";
    } else {
      taskEl.style.opacity = "1";
    }

    taskList.appendChild(taskEl);
  }

  // open/close modal
  function openModal(editing = false, taskEl = null) {
    modal.style.display = "flex";
    modalTitle.innerText = editing ? "Edit Task" : "Add Task";
    if (editing && taskEl) {
      taskIdInput.value = taskEl.dataset.id || "";
      document.getElementById("task-title").value = taskEl.querySelector("h3")?.innerText || "";
      // body is first <p> that is not Deadline/Priority/Status
      const pEls = Array.from(taskEl.querySelectorAll("p"));
      const bodyP = pEls.find(p => {
        const t = p.innerText.toLowerCase();
        return !t.startsWith("deadline:") && !t.startsWith("priority:") && !t.startsWith("status:");
      }) || { innerText: "" };
      document.getElementById("task-body").value = bodyP.innerText || "";
      const deadlineText = (pEls.find(p => p.innerText.toLowerCase().startsWith("deadline:")) || { innerText: "" }).innerText.replace(/Deadline:/i, "").trim();
      document.getElementById("task-deadline").value = parseToIsoDate(deadlineText) || "";
      const priorityText = (pEls.find(p => p.innerText.toLowerCase().startsWith("priority:")) || { innerText: "Priority: MEDIUM" }).innerText.replace(/Priority:/i, "").trim();
      document.getElementById("task-priority").value = priorityText.toUpperCase() || "MEDIUM";
    } else {
      form.reset();
      taskIdInput.value = "";
    }
  }
  function closeModal() {
    modal.style.display = "none";
    form.reset();
    taskIdInput.value = "";
  }

  addBtn?.addEventListener("click", () => openModal(false));
  closeBtn?.addEventListener("click", closeModal);

  // add/edit submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = taskIdInput.value;
    const payload = {
      userId: user.id,
      title: document.getElementById("task-title").value.trim(),
      body: document.getElementById("task-body").value.trim(),
      priority: document.getElementById("task-priority").value,
      // backend agreed date-only string (yyyy-mm-dd) or null
      deadline: (document.getElementById("task-deadline").value || null)
    };

    try {
      let res;
      if (id) {
        res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update task");
        showToast("Task updated");
      } else {
        res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create task");
        showToast("Task created");
      }
      // always re-fetch from server (authoritative)
      await fetchTasks();
      closeModal();
    } catch (err) {
      console.error("save task error:", err);
      showToast("Error saving task", "error");
    }
  });

  // task actions: edit, delete, mark complete
  taskList.addEventListener("click", async (e) => {
    const taskEl = e.target.closest(".task");
    if (!taskEl) return;
    const id = taskEl.dataset.id;

    // EDIT
    if (e.target.classList.contains("edit-btn")) {
      openModal(true, taskEl);
      return;
    }

    // DELETE
    if (e.target.classList.contains("delete-btn")) {
      if (!confirm("Delete this task?")) return;
      try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        showToast("Task deleted");
        await fetchTasks();
      } catch (err) {
        console.error("delete error:", err);
        showToast("Error deleting task", "error");
      }
      return;
    }

    // MARK AS COMPLETED (only mark; UI hides button afterwards)
    if (e.target.classList.contains("complete-btn")) {
      const btn = e.target;
      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/complete`, { method: "PUT" });
        if (!res.ok) throw new Error("Failed to mark complete");
        // optional: read returned updated task
        try { await res.json(); } catch(_) { /* ignore parse errors */ }
        showToast("Task marked as completed");
        await fetchTasks();
      } catch (err) {
        console.error("complete error:", err);
        btn.disabled = false;
        showToast("Error updating task", "error");
      }
    }
  });

  // parse "20 Sept, 2025" etc -> yyyy-mm-dd ; returns "" if invalid
  function parseToIsoDate(str) {
    if (!str || str === "N/A") return "";
    // direct parse (works if string from toLocaleDateString)
    const d = new Date(str);
    if (!isNaN(d.valueOf())) return d.toISOString().split("T")[0];
    // fallback: try yyyy-mm-dd already
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return "";
  }

  // initial load
  fetchTasks();
});
