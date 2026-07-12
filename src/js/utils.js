// js/utils.js
// Funciones puras / de infraestructura: fetching a la API, transformación
// de datos y persistencia en localStorage. Sin lógica de DOM acá.

import axios from 'axios';

const STORAGE_PREFIX = 'comicsanscon_chat_history_';

/**
 * Llama a nuestra Vercel Function /api/chat.
 * @param {string} characterId
 * @param {Array<{role: 'user'|'assistant', text: string}>} messages
 * @returns {Promise<string>} el texto de respuesta del personaje
 */
export async function fetchCharacterReply(characterId, messages) {
  const response = await axios.post(
    '/api/chat',
    { characterId, messages },
    { timeout: 30000 }
  );
  return transformChatResponse(response.data);
}

/**
 * Transforma la respuesta cruda de la API en el texto que vamos a mostrar.
 * Separada del fetching para poder testearla de forma aislada.
 */
export function transformChatResponse(data) {
  if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('Respuesta de la IA vacía o inválida.');
  }
  return data.reply.trim();
}

/**
 * Interpreta errores de axios y devuelve un mensaje amigable para el usuario.
 */
export function parseApiError(error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'El personaje tardó demasiado en responder. Probá de nuevo.';
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisá tu conexión.';
    }
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

/* ---------------------- Persistencia en localStorage ---------------------- */

function storageKey(characterId) {
  return `${STORAGE_PREFIX}${characterId}`;
}

/** Guarda el historial de un personaje en localStorage. */
export function saveHistory(characterId, messages) {
  try {
    localStorage.setItem(storageKey(characterId), JSON.stringify(messages));
  } catch (e) {
    console.warn('No se pudo guardar el historial en localStorage:', e);
  }
}

/** Carga el historial de un personaje desde localStorage (o [] si no hay). */
export function loadHistory(characterId) {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('No se pudo leer el historial de localStorage:', e);
    return [];
  }
}

/** Borra el historial guardado de un personaje puntual. */
export function clearHistory(characterId) {
  localStorage.removeItem(storageKey(characterId));
}

/** true si hay historial guardado para ese personaje. */
export function hasStoredHistory(characterId) {
  return !!localStorage.getItem(storageKey(characterId));
}

/** Formatea una marca de tiempo (ms epoch) como HH:MM. */
export function formatTimestamp(ms) {
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Escapa HTML básico para evitar inyección al renderizar mensajes. */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
