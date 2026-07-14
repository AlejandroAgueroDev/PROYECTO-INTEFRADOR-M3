import { hasStoredHistory } from "./utils.js";

export function characterCardHtml(character, options = {}) {
  const { mode = "default" } = options;
  const saved = hasStoredHistory(character.id);

  const imageBg = character.image
    ? `
    <div class="character-card-image-bg" 
         style="background-image: url('${character.image}'); 
                --image-opacity: ${character.imageOpacity || 0.25};">
    </div>
  `
    : "";

  const showAvatar =
    character.showAvatar !== false && character.id !== "glados";
  const avatarHtml = showAvatar
    ? `
    <div class="character-card-avatar">${character.avatarEmoji || "🔮"}</div>
  `
    : "";

  const gradientStart = character.gradientColors?.[0] || character.color;
  const gradientEnd = character.gradientColors?.[1] || character.color;

  const buttonHtml =
    mode === "about"
      ? `<button class="character-card-btn character-card-btn--about" data-action="about" data-character-id="${character.id}" type="button">
          Conocer más
          <i class="fa-solid fa-arrow-right arrow-icon"></i>
        </button>`
      : `<button class="character-card-btn" data-chat-id="${character.id}" type="button">
          Chatear
          <i class="fa-solid fa-arrow-right arrow-icon"></i>
        </button>`;

  return `
    <article class="character-card" 
             style="--card-accent:${character.color}; 
                    --glow-color:${character.color}66;
                    --gradient-start: ${gradientStart};
                    --gradient-end: ${gradientEnd};" 
             data-id="${character.id}">
      ${imageBg}
      <div class="character-card-content">
        ${avatarHtml}
        <h3>${character.name}</h3>
        ${buttonHtml}
        <p class="character-card-tagline">${character.tagline}</p>
      </div>
    </article>`;
}

export function characterModalHtml(character) {
  const imageHtml = character.image
    ? `<img class="character-modal__image" src="${character.image}" alt="${character.name}" />`
    : "";

  return `
    <div class="character-modal" role="dialog" aria-modal="true" aria-labelledby="character-modal-title">
      <div class="character-modal__backdrop"></div>
      <div class="character-modal__content">
        <button class="character-modal__close" type="button" aria-label="Cerrar información">
          <i class="fa-solid fa-xmark"></i>
        </button>
        ${imageHtml}
        <h3 id="character-modal-title">${character.name}</h3>
        <p class="character-modal__franchise">${character.franchise}</p>
        <p>${character.tagline}</p>
        <p>${character.bio || "Un personaje icónico con una personalidad distintiva y una presencia memorable en la historia."}</p>
      </div>
    </div>
  `;
}
