// js/app.js
// Punto de entrada: router propio basado en la History API (sin recargas
// de página) + carga dinámica de cada vista (fetch de un fragmento .html)
// según la ruta actual.

import { CHARACTERS } from './characters.js';
import { initChatView } from './chat.js';
import { hasStoredHistory } from './utils.js';
import { matchRoute } from './router.js';

const viewRoot = document.getElementById('view-root');

// Cache en memoria de los fragmentos ya descargados, para no re-fetchear
// la misma vista cada vez que el usuario navega hacia ella.
const viewCache = new Map();

// Token para evitar condiciones de carrera: si el usuario navega rápido
// entre vistas, solo el render más reciente debe pintar el DOM.
let renderToken = 0;

/* ------------------------------ Navegación ------------------------------ */

function navigate(pathname, { replace = false } = {}) {
  if (replace) {
    history.replaceState({}, '', pathname);
  } else {
    history.pushState({}, '', pathname);
  }
  render();
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if (!link) return;
  e.preventDefault();
  const url = new URL(link.href);
  navigate(url.pathname);
});

window.addEventListener('popstate', render);

/* --------------------------- Carga de fragmentos -------------------------- */

async function fetchViewHtml(viewName) {
  if (viewCache.has(viewName)) return viewCache.get(viewName);

  const response = await fetch(`/src/views/${viewName}.html`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la vista "${viewName}" (HTTP ${response.status}).`);
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
      viewRoot.innerHTML = '<p class="view-loading">No se pudo cargar esta vista. Recargá la página.</p>';
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
    navigate('/home', { replace: true });
    return;
  }

  updateActiveNavLink(match.view);

  switch (match.view) {
    case 'home':
      return renderHome();
    case 'characters':
      return renderCharacters();
    case 'chat':
      return renderChat(match.params.id);
    case 'about':
      return renderAbout();
  }
}

function updateActiveNavLink(currentView) {
  document.querySelectorAll('.main-nav a[data-route]').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === currentView);
  });
}

/* --------------------------- Render: Home view --------------------------- */

async function renderHome() {
  const ok = await renderViewFragment('home');
  if (!ok) return;
  const grid = document.getElementById('home-character-preview');
  grid.innerHTML = CHARACTERS.map(characterCardHtml).join('');
  attachCharacterCardEvents(grid);
}

/* ------------------------ Render: Characters view ------------------------ */

async function renderCharacters() {
  const ok = await renderViewFragment('characters');
  if (!ok) return;
  const grid = document.getElementById('characters-grid');
  grid.innerHTML = CHARACTERS.map(characterCardHtml).join('');
  attachCharacterCardEvents(grid);
}

function characterCardHtml(character) {
  const saved = hasStoredHistory(character.id);
  return `
    <article class="character-card" style="--card-accent:${character.color}" data-id="${character.id}">
      <div class="character-card-avatar">${character.avatarEmoji}</div>
      <h3>${character.name}</h3>
      <span class="character-card-franchise">${character.franchise} · ${character.category}</span>
      <p class="character-card-tagline">${character.tagline}</p>
      ${saved ? '<span class="character-card-badge">💾 Historial guardado</span>' : ''}
      <button class="btn btn-primary character-card-btn" data-chat-id="${character.id}" type="button">
        Chatear
      </button>
    </article>`;
}

function attachCharacterCardEvents(container) {
  container.querySelectorAll('[data-chat-id]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(`/chat/${btn.dataset.chatId}`));
  });
}

/* -------------------------------- Render: Chat view -------------------------------- */

async function renderChat(characterId) {
  const ok = await renderViewFragment('chat');
  if (!ok) return;
  initChatView(characterId);
}

/* -------------------------------- Render: About view -------------------------------- */

async function renderAbout() {
  const ok = await renderViewFragment('about');
  if (!ok) return;
  const grid = document.getElementById('about-character-preview');
  grid.innerHTML = CHARACTERS.map(characterCardHtml).join('');
  attachCharacterCardEvents(grid);
}

/* -------------------------------- Dark mode -------------------------------- */

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('comicsanscon_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('comicsanscon_theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* --------------------------------- Init --------------------------------- */

function init() {
  initThemeToggle();
  render();
}

init();