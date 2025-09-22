
if (!localStorage.getItem("isLoggedIn")) {

  if (!window.location.pathname.endsWith("login.html") && 
      !window.location.pathname.endsWith("register.html") && 
      !window.location.pathname.endsWith("index.html")) {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const authLink = document.getElementById("authLink");

  if (localStorage.getItem("isLoggedIn")) {

    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("isLoggedIn");
      window.location.href = "login.html";
    });
  } else {

    authLink.textContent = "Login";
    authLink.href = "login.html";
  }
});



