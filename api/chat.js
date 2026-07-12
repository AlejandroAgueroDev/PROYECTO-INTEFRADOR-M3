// api/chat.js
// Vercel Serverless Function.
// Recibe el historial de mensajes + el personaje elegido, arma el prompt
// del sistema con la personalidad correspondiente, y llama a la API de
// Google Gemini usando la API key guardada en variables de entorno del
// servidor (nunca llega al cliente).

import { getPersonality } from "../src/personalities/index.js";

const GEMINI_MODEL = "gemini-flash-latest"; // alias auto-actualizado -> actualmente Gemini 3.5 Flash
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Método no permitido. Usá POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Falta configurar GEMINI_API_KEY en las variables de entorno del servidor.",
    });
  }

  try {
    const { characterId, messages } = req.body || {};

    if (!characterId || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error:
          'Petición inválida. Se requiere "characterId" y un array "messages".',
      });
    }

    const personality = getPersonality(characterId);
    if (!personality) {
      return res
        .status(404)
        .json({ error: `Personaje "${characterId}" no encontrado.` });
    }

    // Transformamos nuestro historial { role: 'user' | 'assistant', text }
    // al formato que espera Gemini: { role: 'user' | 'model', parts: [{ text }] }
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const geminiPayload = {
      contents,
      systemInstruction: {
        role: "system",
        parts: [{ text: personality.systemPrompt }],
      },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 256,
        topP: 0.95,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error de Gemini API:", response.status, errorBody);
      return res.status(502).json({
        error:
          "La IA no pudo responder en este momento. Intentá de nuevo en unos segundos.",
      });
    }

    const data = await response.json();

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason === "SAFETY") {
      return res.status(200).json({
        reply: "Prefiero no responder eso. ¿Probamos con otra pregunta?",
        characterId,
      });
    }

    const text = candidate?.content?.parts?.map((p) => p.text).join("") ?? null;

    if (!text) {
      return res
        .status(502)
        .json({ error: "La IA devolvió una respuesta vacía. Probá de nuevo." });
    }

    return res.status(200).json({ reply: text, characterId });
  } catch (error) {
    console.error("Error inesperado en /api/chat:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
