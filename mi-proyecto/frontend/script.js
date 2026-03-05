/* =========================================
   GESTOR DE NOTAS PRIVADAS
   Frontend seguro con LocalStorage
========================================= */

/* =========================================
   UTILIDADES DE SEGURIDAD
========================================= */

// Hash SHA-256 real
async function hashSHA256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Sanitización básica contra XSS
  function sanitizeInput(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Generar ID seguro
  function generateId() {
    return crypto.randomUUID();
  }
  
  /* =========================================
     LOCAL STORAGE HELPERS
  ========================================= */
  
  function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
  }
  
  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }
  
  function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
  }
  
  function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }
  
  function logoutUser() {
    localStorage.removeItem("currentUser");
  }
  
  /* =========================================
     SELECTORES DOM
  ========================================= */
  
  const authView = document.getElementById("auth-view");
  const dashboardView = document.getElementById("dashboard-view");
  const formView = document.getElementById("note-form-view");
  const detailView = document.getElementById("note-detail-view");
  
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  
  const showRegisterBtn = document.getElementById("show-register");
  const showLoginBtn = document.getElementById("show-login");
  
  const newNoteBtn = document.getElementById("new-note");
  const logoutBtn = document.getElementById("logout");
  
  const noteForm = document.getElementById("note-form");
  const cancelNoteBtn = document.getElementById("cancel-note");
  
  const notesGrid = document.getElementById("notes-grid");
  
  const detailTitle = document.getElementById("detail-title");
  const detailDate = document.getElementById("detail-date");
  const detailContent = document.getElementById("detail-content");
  
  const editNoteBtn = document.getElementById("edit-note");
  const deleteNoteBtn = document.getElementById("delete-note");
  const backDashboardBtn = document.getElementById("back-dashboard");
  
  const themeToggle = document.getElementById("theme-toggle");
  
  let editingNoteId = null;
  let viewingNoteId = null;
  
  /* =========================================
     VISTAS
  ========================================= */
  
  function showView(view) {
    [authView, dashboardView, formView, detailView].forEach(v =>
      v.classList.add("hidden")
    );
    view.classList.remove("hidden");
  }
  
  /* =========================================
     VALIDACIONES
  ========================================= */
  
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  /* =========================================
     REGISTRO
  ========================================= */
  
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const email = sanitizeInput(document.getElementById("register-email").value.trim());
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;
  
    if (!isValidEmail(email)) {
      alert("Email inválido");
      return;
    }
  
    if (password.length < 6) {
      alert("La contraseña debe tener mínimo 6 caracteres");
      return;
    }
  
    if (password !== confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }
  
    const users = getUsers();
  
    if (users.some(user => user.email === email)) {
      alert("El usuario ya existe");
      return;
    }
  
    const hashedPassword = await hashSHA256(password);
  
    users.push({
      id: generateId(),
      email,
      password: hashedPassword,
      notes: []
    });
  
    saveUsers(users);
  
    alert("Cuenta creada correctamente");
    registerForm.reset();
    showView(authView);
  });
  
  /* =========================================
     LOGIN
  ========================================= */
  
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const email = sanitizeInput(document.getElementById("login-email").value.trim());
    const password = document.getElementById("login-password").value;
  
    const users = getUsers();
    const hashedPassword = await hashSHA256(password);
  
    const user = users.find(u => u.email === email && u.password === hashedPassword);
  
    if (!user) {
      alert("Credenciales incorrectas");
      return;
    }
  
    setCurrentUser({ id: user.id, email: user.email });
    loginForm.reset();
    loadDashboard();
  });
  
  /* =========================================
     DASHBOARD
  ========================================= */
  
  function loadDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showView(authView);
      return;
    }
  
    showView(dashboardView);
    renderNotes();
  }
  
  function renderNotes() {
    const currentUser = getCurrentUser();
    const users = getUsers();
    const user = users.find(u => u.id === currentUser.id);
  
    notesGrid.innerHTML = "";
  
    const sortedNotes = [...user.notes].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  
    sortedNotes.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";
  
      const title = document.createElement("h3");
      title.textContent = note.title;
  
      const date = document.createElement("p");
      date.className = "date";
      date.textContent = new Date(note.createdAt).toLocaleString();
  
      const summary = document.createElement("p");
      summary.textContent = note.content.substring(0, 80) + "...";
  
      const actions = document.createElement("div");
      actions.className = "actions";
  
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "Ver";
      viewBtn.className = "btn ghost";
      viewBtn.onclick = () => viewNote(note.id);
  
      const editBtn = document.createElement("button");
      editBtn.textContent = "Editar";
      editBtn.className = "btn primary";
      editBtn.onclick = () => editNote(note.id);
  
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Eliminar";
      deleteBtn.className = "btn danger";
      deleteBtn.onclick = () => deleteNote(note.id);
  
      actions.append(viewBtn, editBtn, deleteBtn);
  
      card.append(title, date, summary, actions);
      notesGrid.appendChild(card);
    });
  }
  
  /* =========================================
     CREAR / EDITAR NOTA
  ========================================= */
  
  newNoteBtn.addEventListener("click", () => {
    editingNoteId = null;
    noteForm.reset();
    showView(formView);
  });
  
  noteForm.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const title = sanitizeInput(document.getElementById("note-title").value.trim());
    const content = sanitizeInput(document.getElementById("note-content").value.trim());
  
    if (!title || !content) {
      alert("Todos los campos son obligatorios");
      return;
    }
  
    const users = getUsers();
    const currentUser = getCurrentUser();
    const user = users.find(u => u.id === currentUser.id);
  
    if (editingNoteId) {
      const note = user.notes.find(n => n.id === editingNoteId);
      note.title = title;
      note.content = content;
    } else {
      user.notes.push({
        id: generateId(),
        title,
        content,
        createdAt: new Date().toISOString()
      });
    }
  
    saveUsers(users);
    loadDashboard();
  });
  
  cancelNoteBtn.addEventListener("click", () => loadDashboard());
  
  /* =========================================
     VER NOTA
  ========================================= */
  
  function viewNote(id) {
    const users = getUsers();
    const currentUser = getCurrentUser();
    const user = users.find(u => u.id === currentUser.id);
  
    const note = user.notes.find(n => n.id === id);
    viewingNoteId = id;
  
    detailTitle.textContent = note.title;
    detailContent.textContent = note.content;
    detailDate.textContent = new Date(note.createdAt).toLocaleString();
  
    showView(detailView);
  }
  
  /* =========================================
     EDITAR NOTA
  ========================================= */
  
  function editNote(id) {
    const users = getUsers();
    const currentUser = getCurrentUser();
    const user = users.find(u => u.id === currentUser.id);
  
    const note = user.notes.find(n => n.id === id);
  
    editingNoteId = id;
  
    document.getElementById("note-title").value = note.title;
    document.getElementById("note-content").value = note.content;
  
    showView(formView);
  }
  
  /* =========================================
     ELIMINAR NOTA
  ========================================= */
  
  function deleteNote(id) {
    if (!confirm("¿Seguro que quieres eliminar esta nota?")) return;
  
    const users = getUsers();
    const currentUser = getCurrentUser();
    const user = users.find(u => u.id === currentUser.id);
  
    user.notes = user.notes.filter(n => n.id !== id);
  
    saveUsers(users);
    loadDashboard();
  }
  
  deleteNoteBtn.addEventListener("click", () => deleteNote(viewingNoteId));
  backDashboardBtn.addEventListener("click", () => loadDashboard());
  editNoteBtn.addEventListener("click", () => editNote(viewingNoteId));
  
  /* =========================================
     LOGOUT
  ========================================= */
  
  logoutBtn.addEventListener("click", () => {
    logoutUser();
    showView(authView);
  });
  
  /* =========================================
     THEME TOGGLE
  ========================================= */
  
  function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggle.textContent = savedTheme === "dark" ? "🌙" : "☀️";
  }
  
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "dark" ? "light" : "dark";
  
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "dark" ? "🌙" : "☀️";
  });
  
  /* =========================================
     INIT
  ========================================= */
  
  document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    const currentUser = getCurrentUser();
    if (currentUser) {
      loadDashboard();
    }
  });
  /* =========================================
   DEMON MODE
========================================= */

const demonToggle = document.getElementById("demon-mode-toggle");

function loadDemonMode() {
  const savedDemon = localStorage.getItem("demonMode") === "true";
  document.documentElement.setAttribute("data-demon", savedDemon);
  demonToggle.textContent = savedDemon ? "🔥" : "😈";
}

demonToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-demon") === "true";
    const newState = !current;
  
    activateDemonEffect(); // ← efecto épico
  
    document.documentElement.setAttribute("data-demon", newState);
    localStorage.setItem("demonMode", newState);
    demonToggle.textContent = newState ? "🔥" : "😈";
  });
/* =========================================
   DETECCIÓN DE DEVTOOLS (TROLEO)
========================================= */

function detectDevTools() {
    const threshold = 160;
  
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
  
    if (widthDiff || heightDiff) {
      activateTrollDefense();
    }
  }
  
  let trollActivated = false;
  
  function activateTrollDefense() {
    if (trollActivated) return;
    trollActivated = true;
  
    document.body.style.filter = "hue-rotate(180deg) saturate(2)";
    
    const warning = document.createElement("div");
    warning.textContent = "⚠️ Sistema de defensa activado. Te estamos observando 😈";
    warning.style.position = "fixed";
    warning.style.bottom = "20px";
    warning.style.left = "50%";
    warning.style.transform = "translateX(-50%)";
    warning.style.background = "red";
    warning.style.color = "white";
    warning.style.padding = "10px 20px";
    warning.style.borderRadius = "10px";
    warning.style.zIndex = "9999";
    warning.style.fontWeight = "bold";
  
    document.body.appendChild(warning);
  }
  
  window.addEventListener("resize", detectDevTools);
  /* =========================================
   CONSOLE WARNING
========================================= */

console.log("%c¡ALTO!", "color:red; font-size:40px; font-weight:bold;");
console.log(
  "%cSi alguien te pidió pegar código aquí, es probable que sea un ataque.\nEsta aplicación no requiere pegar código en la consola.",
  "font-size:14px;"
);
window.addEventListener("storage", () => {
    document.documentElement.setAttribute("data-demon", "true");
  });
  function fakeTrace() {
    const banner = document.createElement("div");
    banner.textContent = "IP registrada. Actividad sospechosa detectada.";
    banner.style.position = "fixed";
    banner.style.top = "0";
    banner.style.left = "0";
    banner.style.width = "100%";
    banner.style.background = "black";
    banner.style.color = "lime";
    banner.style.padding = "5px";
    banner.style.textAlign = "center";
    banner.style.fontFamily = "monospace";
    banner.style.zIndex = "9999";
  
    document.body.appendChild(banner);
  }
  function activateDemonEffect() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "black";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.4s ease";
    overlay.style.zIndex = "9999";
  
    document.body.appendChild(overlay);
  
    setTimeout(() => {
      overlay.style.opacity = "1";
    }, 10);
  
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 400);
    }, 400);
  }
  const brechaBtn = document.getElementById("brechaBtn");
const troleoOverlay = document.getElementById("troleoOverlay");

brechaBtn.addEventListener("click", () => {
  troleoOverlay.style.display = "flex";

  // Sonido opcional troll
  const audio = new Audio("https://www.myinstants.com/media/sounds/vine-boom.mp3");
  audio.play();

  // Texto fake hacker
  console.log("%c⚠️ BRECHA DE SEGURIDAD DETECTADA ⚠️", "color: red; font-size: 20px;");
  console.log("%cRastreando IP del atacante...", "color: lime;");
  console.log("%cEnviando datos al servidor central...", "color: yellow;");
});

// Cerrar al hacer click
troleoOverlay.addEventListener("click", () => {
  troleoOverlay.style.display = "none";
});
