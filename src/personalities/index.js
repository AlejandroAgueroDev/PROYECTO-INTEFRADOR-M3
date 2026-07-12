import glados from './glados.js';
import yoda from './yoda.js';
import geralt from './geralt.js';

// Mapa id -> personalidad completa (incluye systemPrompt). SOLO se usa server-side.
export const personalities = {
  [glados.id]: glados,
  [yoda.id]: yoda,
  [geralt.id]: geralt,
};

export function getPersonality(id) {
  return personalities[id] || null;
}
