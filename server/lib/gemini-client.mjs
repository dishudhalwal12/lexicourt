const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function normalizeApiKeys(apiKeys = []) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    ...apiKeys
  ]
    .map((key) => String(key || "").trim())
    .filter(Boolean);

  return [...new Set(keys)];
}

export function isGeminiConfigured(apiKeys = []) {
  return normalizeApiKeys(apiKeys).length > 0;
}

export async function generateGeminiText({
  systemInstruction,
  userPrompt,
  temperature = 0.3,
  responseMimeType,
  apiKeys = []
}) {
  const availableKeys = normalizeApiKeys(apiKeys);
  if (!availableKeys.length) {
    throw new Error("Gemini API key is not configured.");
  }

  let lastError = null;

  for (const apiKey of availableKeys) {
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
      lastError = new Error(payload.error?.message || "Gemini request failed.");

      if ([429, 500, 502, 503, 504].includes(response.status)) {
        continue;
      }

      throw lastError;
    }

    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!text) {
      lastError = new Error("Gemini returned an empty response.");
      continue;
    }

    return text;
  }

  throw lastError || new Error("Gemini request failed for all configured API keys.");
}

export async function generateGeminiJson(options) {
  const text = await generateGeminiText({
    ...options,
    responseMimeType: "application/json"
  });

  return JSON.parse(text);
}
