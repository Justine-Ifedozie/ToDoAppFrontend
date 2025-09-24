
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:8080/api/users";
  let user = JSON.parse(localStorage.getItem("user"));


  if (!user) {
    window.location.href = "login.html";
    return;
  }


  const profileUsername = document.getElementById("profile-username");
  const profileEmail = document.getElementById("profile-email");
  const editBtn = document.getElementById("edit-profile-btn");

  const modal = document.getElementById("profile-modal");
  const form = document.getElementById("profile-form");
  const closeBtn = document.getElementById("close-profile-modal");

  const usernameInput = document.getElementById("edit-username");
  const emailInput = document.getElementById("edit-email");
  const passwordInput = document.getElementById("edit-password");


  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }

  function renderProfile() {
    profileUsername.innerText = user.username;
    profileEmail.innerText = `Email: ${user.email}`;
  }

  renderProfile();

  function openModal() {
    usernameInput.value = user.username || "";
    emailInput.value = user.email || "";
    passwordInput.value = "";
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
    form.reset();
  }

  editBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") closeModal();
  });


  function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim(); 

    if (!username) {
      showToast("Username cannot be empty", "error");
      return;
    }
    if (!email || !isValidEmail(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }

    const payload = { username, email };
    if (password) payload.password = password;


    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {

        let msg = "Failed to update profile";
        try {
          const err = await res.json();
          if (err && err.message) msg = err.message;
          else if (typeof err === "string") msg = err;
        } catch (parseErr) {
          msg = res.statusText || msg;
        }
        throw new Error(msg);
      }

      const updated = await res.json();

      user = { ...user, ...updated };
      localStorage.setItem("user", JSON.stringify(user));

      renderProfile();
      showToast("Profile updated successfully", "success");
      closeModal();
    } catch (err) {
      console.error("Update profile error:", err);
      showToast(err.message || "Error updating profile", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
