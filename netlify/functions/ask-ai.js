// netlify/functions/ask-ai.js
const fetch = require("node-fetch");

exports.handler = async function (event) {
  try {
    const { question, imageBase64, imageMimeType, modelName } = JSON.parse(event.body);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!modelName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "modelName is required" })
      };
    }

    /* ======================================================
       🔹 GEMINI MODELS
       ====================================================== */
    if (modelName.startsWith("gemini")) {
      if (!GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY");
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

      const parts = [{ text: question || "Describe this image in detail." }];

      if (imageBase64 && imageMimeType) {
        parts.unshift({
          inline_data: {
            mime_type: imageMimeType,
            data: imageBase64
          }
        });
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });

      const data = await response.json();

      if (!response.ok || !data.candidates) {
        console.error("Gemini API Error:", data);
        throw new Error("Gemini API failed");
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          answer: data.candidates[0].content.parts[0].text
        })
      };
    }

    /* ======================================================
       🔹 OPENROUTER MODELS
       ====================================================== */
    else {
      if (!OPENROUTER_API_KEY) {
        throw new Error("Missing OPENROUTER_API_KEY");
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              role: "user",
              content: question || "Explain clearly."
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok || !data.choices) {
        console.error("OpenRouter API Error:", data);
        throw new Error("OpenRouter API failed");
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          answer: data.choices[0].message.content
        })
      };
    }

  } catch (error) {
    console.error("ask-ai function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
