import {
  validateKey,
  recallMemories,
  rememberContent,
  fetchSelectorConfig,
} from "../utils/api.js";
import {
  setApiKey,
  setUserInfo,
  clearApiKey,
  getSettings,
  setCachedSelectors,
  getCachedSelectors,
} from "../utils/storage.js";
import { SELECTOR_REFRESH_INTERVAL_MS } from "../utils/constants.js";

/**
 * Service worker handles all API communication.
 * Content scripts send messages here; service worker makes the fetch calls.
 * This avoids CORS issues since service workers aren't subject to page CORS.
 */

// ─── Message Router ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => {
      sendResponse({ error: err.message });
    });
  return true; // keep message channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case "VALIDATE_KEY":
      return handleValidateKey(message.apiKey);

    case "RECALL":
      return handleRecall(message.query, message.topK, message.platform);

    case "REMEMBER":
      return handleRemember(message.content, message.platform, message.tags);

    case "GET_SETTINGS":
      return getSettings();

    case "DISCONNECT":
      await clearApiKey();
      updateBadge(false);
      return { success: true };

    case "REFRESH_SELECTORS":
      return refreshSelectors();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ─── Handlers ────────────────────────────────────────────────

async function handleValidateKey(apiKey) {
  const result = await validateKey(apiKey);
  if (!result || !result.valid) {
    throw new Error("Invalid API key");
  }
  await setApiKey(apiKey);
  await setUserInfo(result);
  updateBadge(true);

  // Fetch selectors on first connect
  await refreshSelectors();

  return result;
}

async function handleRecall(query, topK, platform) {
  const settings = await getSettings();
  if (!settings.autoInject) {
    return { has_context: false, injection_block: "", memory_count: 0 };
  }
  return recallMemories(query, topK || settings.maxMemories, platform);
}

async function handleRemember(content, platform, tags) {
  return rememberContent(content, platform, tags);
}

async function refreshSelectors() {
  try {
    const config = await fetchSelectorConfig();
    if (config) {
      await setCachedSelectors(config);
      return config;
    }
  } catch (err) {
    console.warn("[ContextOS] Failed to refresh selectors:", err);
  }
  // Fall back to cached version
  return getCachedSelectors();
}

// ─── Badge ───────────────────────────────────────────────────

function updateBadge(connected) {
  chrome.action.setBadgeText({ text: connected ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({
    color: connected ? "#10B981" : "#EF4444",
  });
}

// ─── Periodic selector refresh ───────────────────────────────

chrome.alarms.create("refreshSelectors", {
  periodInMinutes: SELECTOR_REFRESH_INTERVAL_MS / 60000,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshSelectors") {
    refreshSelectors();
  }
});

// ─── On install ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log("[ContextOS] Extension installed");
  refreshSelectors();
});
