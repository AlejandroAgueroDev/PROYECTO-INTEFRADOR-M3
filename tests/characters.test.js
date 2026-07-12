import { describe, it, expect } from 'vitest';
import { CHARACTERS, getCharacterById } from '../js/characters.js';

describe('CHARACTERS', () => {
  it('tiene exactamente 3 personajes', () => {
    expect(CHARACTERS).toHaveLength(3);
  });

  it('cada personaje tiene los campos mínimos requeridos', () => {
    CHARACTERS.forEach((c) => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('franchise');
      expect(c).toHaveProperty('tagline');
      expect(c).toHaveProperty('avatarEmoji');
      expect(c).toHaveProperty('color');
    });
  });

  it('no expone systemPrompt en el cliente', () => {
    CHARACTERS.forEach((c) => {
      expect(c).not.toHaveProperty('systemPrompt');
    });
  });

  it('los ids son únicos', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getCharacterById', () => {
  it('devuelve el personaje correcto', () => {
    const character = getCharacterById('glados');
    expect(character?.name).toBe('GLaDOS');
  });

  it('devuelve null si no existe', () => {
    expect(getCharacterById('no-existe')).toBeNull();
  });
});
