const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function getApiKey() {
  return process.env.GEMINI_API_KEY || "";
}

export function isGeminiConfigured() {
  return Boolean(getApiKey());
}

export async function generateGeminiText({
  systemInstruction,
  userPrompt,
  temperature = 0.3,
  responseMimeType
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature,
        responseMimeType
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini request failed.");
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function generateGeminiJson(options) {
  const text = await generateGeminiText({
    ...options,
    responseMimeType: "application/json"
  });

  return JSON.parse(text);
}
