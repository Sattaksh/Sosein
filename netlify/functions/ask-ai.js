// netlify/functions/ask-ai.js
const fetch = require("node-fetch");

exports.handler = async function (event) {
  try {
    const { question, imageBase64, imageMimeType, modelName } =
      JSON.parse(event.body || "{}");

    if (!modelName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "modelName is required" })
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    console.log("MODEL USED:", modelName);

    /* ===================== GEMINI / GEMMA ===================== */
    if (modelName.startsWith("gemini") || modelName.startsWith("gemma")) {
      if (!GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY");
      }

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

      const parts = [];

      // Images ONLY for Gemini (Gemma is text-only)
      if (
        modelName.startsWith("gemini") &&
        imageBase64 &&
        imageMimeType
      ) {
        parts.push({
          inline_data: {
            mime_type: imageMimeType,
            data: imageBase64
          }
        });
      }

      parts.push({
        text: question || "Explain clearly."
      });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });

      const data = await response.json();

      if (!response.ok || !data.candidates?.length) {
        console.error("Gemini/Gemma error:", data);
        throw new Error("Gemini/Gemma API failed");
      }

      const answer = data.candidates[0].content.parts
        .map(p => p.text)
        .join("");

      return {
        statusCode: 200,
        body: JSON.stringify({ answer })
      };
    }

    /* ===================== OPENROUTER ===================== */
    if (!OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://sosein.netlify.app",
          "X-Title": "Sosein Search"
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content:
                "Answer clearly and directly. Do not show reasoning or step-by-step thinking."
            },
            {
              role: "user",
              content: question || "Explain clearly."
            }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.choices?.length) {
      console.error("OpenRouter error:", data);
      throw new Error("OpenRouter API failed");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: data.choices[0].message.content
      })
    };

  } catch (error) {
    console.error("ask-ai function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
