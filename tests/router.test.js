import { describe, it, expect } from 'vitest';
import { matchRoute } from '../js/router.js';

describe('matchRoute', () => {
  it('matchea la raíz "/" como home', () => {
    expect(matchRoute('/')).toEqual({ view: 'home', params: {} });
  });

  it('matchea "/home" explícitamente', () => {
    expect(matchRoute('/home')).toEqual({ view: 'home', params: {} });
  });

  it('matchea "/characters"', () => {
    expect(matchRoute('/characters')).toEqual({ view: 'characters', params: {} });
  });

  it('matchea "/about"', () => {
    expect(matchRoute('/about')).toEqual({ view: 'about', params: {} });
  });

  it('matchea "/chat/:id" y extrae el parámetro id', () => {
    const result = matchRoute('/chat/glados');
    expect(result.view).toBe('chat');
    expect(result.params.id).toBe('glados');
  });

  it('matchea ids de personaje con guiones', () => {
    const result = matchRoute('/chat/geralt-de-rivia');
    expect(result.params.id).toBe('geralt-de-rivia');
  });

  it('devuelve null para una ruta desconocida', () => {
    expect(matchRoute('/no-existe')).toBeNull();
  });

  it('devuelve null para "/chat" sin id', () => {
    expect(matchRoute('/chat')).toBeNull();
  });
});
