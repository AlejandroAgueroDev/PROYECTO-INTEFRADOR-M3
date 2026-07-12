import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import handler from "../src/api/chat.js";

// Helper para simular objetos req/res de Vercel (Node-like) en los tests.
function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
  };
  return res;
}

describe("POST /api/chat", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "fake-test-key";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  it("rechaza métodos que no sean POST", async () => {
    const req = { method: "GET" };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("devuelve 400 si falta characterId o messages", async () => {
    const req = { method: "POST", body: { characterId: "glados" } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("devuelve 404 si el personaje no existe", async () => {
    const req = {
      method: "POST",
      body: {
        characterId: "personaje-inventado",
        messages: [{ role: "user", text: "hola" }],
      },
    };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("devuelve 500 si falta la GEMINI_API_KEY en el servidor", async () => {
    delete process.env.GEMINI_API_KEY;
    const req = {
      method: "POST",
      body: {
        characterId: "glados",
        messages: [{ role: "user", text: "hola" }],
      },
    };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("llama a Gemini y devuelve la respuesta parseada correctamente", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: "Interesante. La ciencia lo confirma." }],
            },
          },
        ],
      }),
    });

    const req = {
      method: "POST",
      body: {
        characterId: "glados",
        messages: [{ role: "user", text: "Hola GLaDOS" }],
      },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(options.headers["x-goog-api-key"]).toBe("fake-test-key");

    const sentBody = JSON.parse(options.body);
    expect(sentBody.systemInstruction.parts[0].text).toContain("GLaDOS");
    expect(sentBody.contents[0]).toEqual({
      role: "user",
      parts: [{ text: "Hola GLaDOS" }],
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBe("Interesante. La ciencia lo confirma.");
  });

  it("devuelve 502 si Gemini responde con error HTTP", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "internal error",
    });

    const req = {
      method: "POST",
      body: { characterId: "yoda", messages: [{ role: "user", text: "hola" }] },
    };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(502);
  });

  it("maneja respuestas bloqueadas por seguridad sin romper", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [{ finishReason: "SAFETY" }] }),
    });

    const req = {
      method: "POST",
      body: {
        characterId: "geralt",
        messages: [{ role: "user", text: "algo delicado" }],
      },
    };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toMatch(/prefiero no responder/i);
  });

  it('transforma correctamente mensajes con role "assistant" a "model" para Gemini', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          { finishReason: "STOP", content: { parts: [{ text: "ok" }] } },
        ],
      }),
    });

    const req = {
      method: "POST",
      body: {
        characterId: "yoda",
        messages: [
          { role: "user", text: "Hola" },
          { role: "assistant", text: "Hmm, saludos" },
          { role: "user", text: "¿Cómo estás?" },
        ],
      },
    };
    const res = createMockRes();
    await handler(req, res);

    const sentBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sentBody.contents.map((c) => c.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
  });
});
