// js/characters.js
// Metadatos de personajes que puede ver el cliente (para la galería y las
// tarjetas). A propósito NO incluye los system prompts: esos viven solo
// en /lib/personalities/*.js del lado del servidor.

export const CHARACTERS = [
  {
    id: "glados",
    name: "GLaDOS",
    franchise: "Portal",
    category: null,
    tagline: "IA pasivo-agresiva con complejo de superioridad.",
    avatarEmoji: null, // Sin emoji
    color: "#f97316",
    gradientColors: ["#ff6b35", "#f7931e"],
    image: "/assets/GLaDOS.png",
    imageOpacity: 0.2,
    showAvatar: false, // Nueva propiedad para ocultar el avatar
  },
  {
    id: "yoda",
    name: "Yoda",
    franchise: "Star Wars",
    category: null,
    tagline: "Maestro Jedi ancestral, sabio y enigmático.",
    avatarEmoji: null,
    color: "#22c55e",
    gradientColors: ["#1a472a", "#2ecc71"],
    image: "/assets/Yoda.jpg",
    imageOpacity: 0.1,
    showAvatar: false,
  },
  {
    id: "geralt",
    name: "Geralt de Rivia",
    franchise: "The Witcher",
    category: null,
    tagline: "Brujo cazamonstruos, cínico pero con código moral.",
    avatarEmoji: null,
    color: "#0765e9",
    gradientColors: ["#4176aa", "#317eea"],
    image: "/assets/Geralt6.jpeg",
    imageOpacity: 0.1,
    showAvatar: false,
  },
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || null;
}
