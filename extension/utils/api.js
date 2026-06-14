import { API_BASE_URL } from "./constants.js";
import { getApiKey } from "./storage.js";

/**
 * Makes authenticated API calls to the ContextOS backend.
 * All calls go through the service worker to avoid CORS issues.
 */
export async function contextosAPI(endpoint, options = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("No API key configured");
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export async function validateKey(apiKey) {
  const url = `${API_BASE_URL}/auth/validate-key`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function recallMemories(query, topK = 5, platform = "unknown") {
  return contextosAPI(
    `/extension/recall?query=${encodeURIComponent(query)}&top_k=${topK}&platform=${platform}`,
    { method: "POST" }
  );
}

export async function rememberContent(content, platform, tags = []) {
  return contextosAPI("/extension/remember", {
    method: "POST",
    body: JSON.stringify({ content, platform, tags }),
  });
}

export async function fetchSelectorConfig() {
  const url = `${API_BASE_URL}/extension/config`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}
