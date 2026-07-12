// js/characters.js
// Metadatos de personajes que puede ver el cliente (para la galería y las
// tarjetas). A propósito NO incluye los system prompts: esos viven solo
// en /lib/personalities/*.js del lado del servidor.

export const CHARACTERS = [
  {
    id: 'glados',
    name: 'GLaDOS',
    franchise: 'Portal',
    category: 'Videojuego',
    tagline: 'IA pasivo-agresiva con complejo de superioridad.',
    avatarEmoji: '🧠',
    color: '#f97316',
  },
  {
    id: 'yoda',
    name: 'Yoda',
    franchise: 'Star Wars',
    category: 'Película',
    tagline: 'Maestro Jedi ancestral, sabio y enigmático.',
    avatarEmoji: '🟢',
    color: '#22c55e',
  },
  {
    id: 'geralt',
    name: 'Geralt de Rivia',
    franchise: 'The Witcher',
    category: 'Serie / Videojuego',
    tagline: 'Brujo cazamonstruos, cínico pero con código moral.',
    avatarEmoji: '🐺',
    color: '#64748b',
  },
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || null;
}
