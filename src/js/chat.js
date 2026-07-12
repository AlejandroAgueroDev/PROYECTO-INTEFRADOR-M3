// js/chat.js
// Lógica específica de la vista de chat: renderizado de mensajes,
// manejo del formulario de envío, estado "escribiendo…" y errores.
// Depende de utils.js para fetching/transformación/persistencia.

import { getCharacterById } from './characters.js';
import {
  fetchCharacterReply,
  parseApiError,
  saveHistory,
  loadHistory,
  clearHistory,
  formatTimestamp,
  escapeHtml,
} from './utils.js';

/**
 * Inicializa la vista de chat para un personaje dado.
 * @param {string} characterId
 */
export function initChatView(characterId) {
  const character = getCharacterById(characterId);
  const root = document.getElementById('view-root');

  if (!character) {
    root.innerHTML = `
      <section class="view">
        <h1>Personaje no encontrado</h1>
        <p>No existe el personaje "${escapeHtml(characterId)}".</p>
        <a href="/characters" data-link class="btn btn-primary">Ver personajes</a>
      </section>`;
    return;
  }

  const els = {
    avatar: document.getElementById('chat-avatar'),
    name: document.getElementById('chat-character-name'),
    messages: document.getElementById('chat-messages'),
    typing: document.getElementById('chat-typing'),
    error: document.getElementById('chat-error'),
    form: document.getElementById('chat-form'),
    input: document.getElementById('chat-input'),
    sendBtn: document.getElementById('chat-send-btn'),
    clearBtn: document.getElementById('chat-clear-btn'),
  };

  els.avatar.textContent = character.avatarEmoji;
  els.avatar.style.background = character.color;
  els.name.textContent = character.name;

  // Estado en memoria de esta sesión de chat
  let messages = loadHistory(characterId); // [{role, text, ts}]
  let isSending = false;

  renderAllMessages();

  els.form.addEventListener('submit', handleSubmit);
  els.input.addEventListener('keydown', handleKeydown);
  els.input.addEventListener('input', autoGrowTextarea);
  els.clearBtn.addEventListener('click', handleClearHistory);

  function autoGrowTextarea() {
    els.input.style.height = 'auto';
    els.input.style.height = `${Math.min(els.input.scrollHeight, 140)}px`;
  }

  function handleKeydown(e) {
    // Enter envía, Shift+Enter hace salto de línea
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      els.form.requestSubmit();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text || isSending) return;

    hideError();

    const userMsg = { role: 'user', text, ts: Date.now() };
    messages.push(userMsg);
    renderMessage(userMsg);
    persistAndScroll();

    els.input.value = '';
    autoGrowTextarea();
    setSending(true);

    try {
      const replyText = await fetchCharacterReply(characterId, toApiMessages(messages));
      const botMsg = { role: 'assistant', text: replyText, ts: Date.now() };
      messages.push(botMsg);
      renderMessage(botMsg);
      persistAndScroll();
    } catch (err) {
      console.error('Error al chatear:', err);
      showError(parseApiError(err));
    } finally {
      setSending(false);
    }
  }

  function handleClearHistory() {
    if (!messages.length) return;
    const confirmed = window.confirm(`¿Borrar todo el historial con ${character.name}?`);
    if (!confirmed) return;
    messages = [];
    clearHistory(characterId);
    els.messages.innerHTML = '';
    hideError();
  }

  function toApiMessages(msgs) {
    // Solo mandamos role + text, sin timestamps, a la API
    return msgs.map(({ role, text }) => ({ role, text }));
  }

  function renderAllMessages() {
    els.messages.innerHTML = '';
    if (messages.length === 0) {
      renderWelcomeBubble();
    }
    messages.forEach(renderMessage);
    scrollToBottom();
  }

  function renderWelcomeBubble() {
    const div = document.createElement('div');
    div.className = 'message message-assistant message-welcome';
    div.innerHTML = `
      <div class="message-bubble">
        ¡Empezá la charla con <strong>${escapeHtml(character.name)}</strong>! Escribí algo abajo. 👇
      </div>`;
    els.messages.appendChild(div);
  }

  function renderMessage(msg) {
    // Si había burbuja de bienvenida, la sacamos al primer mensaje real
    const welcome = els.messages.querySelector('.message-welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `message message-${msg.role}`;
    div.innerHTML = `
      <div class="message-bubble">
        <p class="message-text">${escapeHtml(msg.text)}</p>
        <div class="message-meta">
          <span class="message-time">${formatTimestamp(msg.ts)}</span>
          ${msg.role === 'assistant' ? '<button class="copy-btn" type="button" title="Copiar respuesta">📋</button>' : ''}
        </div>
      </div>`;

    if (msg.role === 'assistant') {
      const copyBtn = div.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => copyToClipboard(msg.text, copyBtn));
    }

    els.messages.appendChild(div);
  }

  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = '✅';
      setTimeout(() => { btn.textContent = original; }, 1200);
    } catch (e) {
      console.warn('No se pudo copiar al portapapeles:', e);
    }
  }

  function setSending(sending) {
    isSending = sending;
    els.sendBtn.disabled = sending;
    els.input.disabled = sending;
    els.typing.classList.toggle('hidden', !sending);
    els.typing.setAttribute('aria-hidden', String(!sending));
    if (sending) scrollToBottom();
  }

  function showError(text) {
    els.error.textContent = `⚠️ ${text}`;
    els.error.classList.remove('hidden');
  }

  function hideError() {
    els.error.classList.add('hidden');
    els.error.textContent = '';
  }

  function persistAndScroll() {
    saveHistory(characterId, messages);
    scrollToBottom();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      els.messages.scrollTop = els.messages.scrollHeight;
    });
  }
}
