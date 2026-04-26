const API_HOST = window.location.protocol === "file:" || !window.location.hostname
  ? "127.0.0.1"
  : window.location.hostname;
const API_BASE = `http://${API_HOST}:8787/api`;
const AI_KEYS_STORAGE_KEY = "lexicourt:gemini-api-keys";

export function getStoredAiApiKeys() {
  try {
    const raw = window.localStorage.getItem(AI_KEYS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw)
      .map((key) => String(key || "").trim())
      .filter(Boolean);
  } catch (error) {
    console.warn("Unable to read stored AI API keys:", error);
    return [];
  }
}

export function storeAiApiKeys(keys) {
  const normalizedKeys = [...new Set(
    String(keys || "")
      .split(/\n|,/)
      .map((key) => key.trim())
      .filter(Boolean)
  )];

  window.localStorage.setItem(AI_KEYS_STORAGE_KEY, JSON.stringify(normalizedKeys));
  return normalizedKeys;
}

async function safeParseJson(response) {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("The API returned an unreadable response.");
  }
}

async function postJson(path, payload) {
  const body = {
    ...(payload || {}),
    apiKeys: getStoredAiApiKeys()
  };
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error("The LexiCourt API is unreachable. Start the local API server and try again.");
  }

  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data.error || "API request failed.");
  }

  return data;
}

export async function fetchCaseInsights(payload) {
  return postJson("/insights/case", payload);
}

export async function chatWithAssistant(payload) {
  return postJson("/assistant/chat", payload);
}

export async function generateDraftFromApi(payload) {
  return postJson("/drafts/generate", payload);
}

export async function generateTimelineFromApi(payload) {
  return postJson("/timelines/generate", payload);
}

export async function generateSummaryFromApi(payload) {
  return postJson("/summaries/generate", payload);
}

export async function classifyDocumentText(payload) {
  return postJson("/documents/classify", payload);
}

export async function uploadFileAsset(payload) {
  return postJson("/files/upload", payload);
}

export async function checkApiHealth() {
  let response;
  try {
    response = await fetch(`${API_BASE}/health`);
  } catch (error) {
    throw new Error("The LexiCourt API is unreachable. Start the local API server and try again.");
  }

  if (!response.ok) {
    throw new Error("API health check failed.");
  }
  return safeParseJson(response);
}
