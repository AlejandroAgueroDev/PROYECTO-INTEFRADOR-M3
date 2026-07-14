import { describe, it, expect } from 'vitest';
import { characterCardHtml, characterModalHtml } from '../src/js/characterCards.js';
import { CHARACTERS } from '../src/js/characters.js';

describe('characterCardHtml', () => {
  it('renderiza el botón de conocer más para la vista About', () => {
    const html = characterCardHtml(CHARACTERS[0], { mode: 'about' });

    expect(html).toContain('Conocer más');
    expect(html).toContain('data-action="about"');
  });
});

describe('characterModalHtml', () => {
  it('genera el contenido del modal con información del personaje', () => {
    const html = characterModalHtml(CHARACTERS[0]);

    expect(html).toContain('GLaDOS');
    expect(html).toContain('Portal');
    expect(html).toContain('IA pasivo-agresiva');
  });
});
