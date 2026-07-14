// js/app.js
// Punto de entrada: router propio basado en la History API (sin recargas
// de página) + carga dinámica de cada vista (fetch de un fragmento .html)
// según la ruta actual.

import { CHARACTERS } from "./characters.js";
import { initChatView } from "./chat.js";
import { characterCardHtml, characterModalHtml } from "./characterCards.js";
import { matchRoute } from "./router.js";

const viewRoot = document.getElementById("view-root");

// Cache en memoria de los fragmentos ya descargados, para no re-fetchear
// la misma vista cada vez que el usuario navega hacia ella.
const viewCache = new Map();

// Token para evitar condiciones de carrera: si el usuario navega rápido
// entre vistas, solo el render más reciente debe pintar el DOM.
let renderToken = 0;

/* ------------------------------ Navegación ------------------------------ */

function navigate(pathname, { replace = false } = {}) {
  if (replace) {
    history.replaceState({}, "", pathname);
  } else {
    history.pushState({}, "", pathname);
  }
  render();
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (!link) return;
  e.preventDefault();
  const url = new URL(link.href);
  navigate(url.pathname);
});

window.addEventListener("popstate", render);

/* --------------------------- Carga de fragmentos -------------------------- */

async function fetchViewHtml(viewName) {
  if (viewCache.has(viewName)) return viewCache.get(viewName);

  const response = await fetch(`/src/views/${viewName}.html`);
  if (!response.ok) {
    throw new Error(
      `No se pudo cargar la vista "${viewName}" (HTTP ${response.status}).`,
    );
  }
  const html = await response.text();
  viewCache.set(viewName, html);
  return html;
}

async function renderViewFragment(viewName) {
  const myToken = ++renderToken;
  viewRoot.innerHTML = '<p class="view-loading">Cargando…</p>';

  let html;
  try {
    html = await fetchViewHtml(viewName);
  } catch (err) {
    console.error(err);
    if (myToken === renderToken) {
      viewRoot.innerHTML =
        '<p class="view-loading">No se pudo cargar esta vista. Recargá la página.</p>';
    }
    return false;
  }

  // Si mientras esperábamos el fetch el usuario ya navegó a otra ruta,
  // descartamos este resultado para no pisar la vista nueva.
  if (myToken !== renderToken) return false;

  viewRoot.innerHTML = html;
  return true;
}

/* -------------------------------- Render -------------------------------- */

async function render() {
  const match = matchRoute(window.location.pathname);

  if (!match) {
    navigate("/home", { replace: true });
    return;
  }

  updateActiveNavLink(match.view);

  switch (match.view) {
    case "home":
      return renderHome();
    case "characters":
      return renderCharacters();
    case "chat":
      return renderChat(match.params.id);
    case "about":
      return renderAbout();
  }
}

function updateActiveNavLink(currentView) {
  document.querySelectorAll(".main-nav a[data-route]").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === currentView);
  });
}

/* --------------------------- Render: Home view --------------------------- */

async function renderHome() {
  const ok = await renderViewFragment("home");
  if (!ok) return;
  const grid = document.getElementById("home-character-preview");
  grid.innerHTML = CHARACTERS.map((character) => characterCardHtml(character)).join("");
  attachCharacterCardEvents(grid);
}

/* ------------------------ Render: Characters view ------------------------ */

async function renderCharacters() {
  const ok = await renderViewFragment("characters");
  if (!ok) return;
  const grid = document.getElementById("characters-grid");
  grid.innerHTML = CHARACTERS.map((character) => characterCardHtml(character)).join("");
  attachCharacterCardEvents(grid);
}

function attachCharacterCardEvents(container) {
  container.querySelectorAll("[data-chat-id]").forEach((btn) => {
    btn.addEventListener("click", () =>
      navigate(`/chat/${btn.dataset.chatId}`),
    );
  });

  container.querySelectorAll("[data-action='about']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const characterId = btn.dataset.characterId;
      const character = CHARACTERS.find((item) => item.id === characterId);
      if (!character) return;

      const modalMarkup = characterModalHtml(character);
      document.body.insertAdjacentHTML("beforeend", modalMarkup);

      const modal = document.querySelector(".character-modal");
      const closeBtn = modal?.querySelector(".character-modal__close");
      const content = modal?.querySelector(".character-modal__content");

      const closeModal = () => modal?.remove();

      closeBtn?.addEventListener("click", closeModal);
      content?.addEventListener("click", (event) => event.stopPropagation());
      modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
          event.stopPropagation();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();
      }, { once: true });
    });
  });
}

/* -------------------------------- Render: Chat view -------------------------------- */

async function renderChat(characterId) {
  const ok = await renderViewFragment("chat");
  if (!ok) return;
  initChatView(characterId);
}

/* -------------------------------- Render: About view -------------------------------- */

async function renderAbout() {
  const ok = await renderViewFragment("about");
  if (!ok) return;
  const grid = document.getElementById("about-character-preview");
  grid.innerHTML = CHARACTERS.map((character) => characterCardHtml(character, { mode: "about" })).join("");
  attachCharacterCardEvents(grid);
}

/* -------------------------------- Dark mode -------------------------------- */

function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("comicsanscon_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = saved || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("comicsanscon_theme", next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const toggleBtn = document.getElementById("theme-toggle");

  toggleBtn.innerHTML =
    theme === "dark"
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
}

/* --------------------------------- Init --------------------------------- */

function init() {
  initThemeToggle();
  render();
}

init();
