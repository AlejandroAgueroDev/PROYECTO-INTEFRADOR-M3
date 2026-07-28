// api/chat.js
// Vercel Serverless Function.
import axios from "axios";
import { getPersonality } from "../src/personalities/index.js";

const GEMINI_MODEL = "gemini-flash-latest";
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
        maxOutputTokens: 1000,
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

    // Llamada con Axios
    const response = await axios.post(GEMINI_URL, geminiPayload, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
    });

    // La data parseada ya viene en response.data
    const data = response.data;

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
    // Si Axios recibe un status fuera de 2xx (por ejemplo 400 u 800), entra acá
    if (error.response) {
      console.error(
        "Error de Gemini API:",
        error.response.status,
        error.response.data
      );
      return res.status(502).json({
        error:
          "La IA no pudo responder en este momento. Intentá de nuevo en unos segundos.",
      });
    }

    console.error("Error inesperado en /api/chat:", error.message || error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}