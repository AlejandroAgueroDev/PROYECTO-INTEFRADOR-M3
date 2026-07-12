import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
  transformChatResponse,
  parseApiError,
  saveHistory,
  loadHistory,
  clearHistory,
  hasStoredHistory,
  formatTimestamp,
  escapeHtml,
  fetchCharacterReply,
} from '../js/utils.js';

// Mockeamos axios por completo: ningún test acá toca la red de verdad.
vi.mock('axios');

describe('transformChatResponse', () => {
  it('devuelve el texto limpio cuando la respuesta es válida', () => {
    const result = transformChatResponse({ reply: '  Hola, sujeto de pruebas.  ' });
    expect(result).toBe('Hola, sujeto de pruebas.');
  });

  it('lanza un error si la respuesta no tiene "reply"', () => {
    expect(() => transformChatResponse({})).toThrow();
  });

  it('lanza un error si "reply" está vacío', () => {
    expect(() => transformChatResponse({ reply: '   ' })).toThrow();
  });

  it('lanza un error si data es null', () => {
    expect(() => transformChatResponse(null)).toThrow();
  });
});

describe('fetchCharacterReply', () => {
  it('llama a axios.post con la URL y payload correctos, y devuelve el texto', async () => {
    axios.post.mockResolvedValueOnce({ data: { reply: 'Hmpf.', characterId: 'geralt' } });

    const messages = [{ role: 'user', text: 'Hola' }];
    const result = await fetchCharacterReply('geralt', messages);

    expect(axios.post).toHaveBeenCalledWith(
      '/api/chat',
      { characterId: 'geralt', messages },
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(result).toBe('Hmpf.');
  });

  it('propaga el error si axios.post rechaza', async () => {
    axios.post.mockRejectedValueOnce(new Error('network down'));
    await expect(fetchCharacterReply('yoda', [])).rejects.toThrow('network down');
  });
});

describe('parseApiError', () => {
  it('devuelve mensaje de timeout para ECONNABORTED', () => {
    axios.isAxiosError = vi.fn().mockReturnValue(true);
    const error = { code: 'ECONNABORTED' };
    expect(parseApiError(error)).toMatch(/tardó demasiado/i);
  });

  it('devuelve el mensaje del backend si viene en response.data.error', () => {
    axios.isAxiosError = vi.fn().mockReturnValue(true);
    const error = { response: { data: { error: 'Personaje no encontrado.' } } };
    expect(parseApiError(error)).toBe('Personaje no encontrado.');
  });

  it('devuelve mensaje de conexión si no hay response', () => {
    axios.isAxiosError = vi.fn().mockReturnValue(true);
    const error = {};
    expect(parseApiError(error)).toMatch(/no se pudo conectar/i);
  });

  it('devuelve mensaje genérico para errores no-axios', () => {
    axios.isAxiosError = vi.fn().mockReturnValue(false);
    expect(parseApiError(new Error('algo raro'))).toMatch(/inesperado/i);
  });
});

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda y carga el historial de un personaje', () => {
    const messages = [{ role: 'user', text: 'Hola', ts: 123 }];
    saveHistory('glados', messages);
    expect(loadHistory('glados')).toEqual(messages);
  });

  it('devuelve [] si no hay historial guardado', () => {
    expect(loadHistory('inexistente')).toEqual([]);
  });

  it('hasStoredHistory refleja correctamente si hay datos', () => {
    expect(hasStoredHistory('yoda')).toBe(false);
    saveHistory('yoda', [{ role: 'user', text: 'hi', ts: 1 }]);
    expect(hasStoredHistory('yoda')).toBe(true);
  });

  it('clearHistory borra el historial guardado', () => {
    saveHistory('geralt', [{ role: 'user', text: 'hi', ts: 1 }]);
    clearHistory('geralt');
    expect(loadHistory('geralt')).toEqual([]);
    expect(hasStoredHistory('geralt')).toBe(false);
  });

  it('loadHistory no rompe si el JSON guardado está corrupto', () => {
    localStorage.setItem('comicsanscon_chat_history_glados', '{not-json');
    expect(loadHistory('glados')).toEqual([]);
  });
});

describe('formatTimestamp', () => {
  it('devuelve un string con formato de hora', () => {
    const result = formatTimestamp(Date.now());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('escapeHtml', () => {
  it('escapa etiquetas HTML para evitar inyección', () => {
    const result = escapeHtml('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('deja intacto texto plano', () => {
    expect(escapeHtml('Hola mundo')).toBe('Hola mundo');
  });
});
