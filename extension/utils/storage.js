/**
 * Thin wrapper around chrome.storage.local for typed access.
 * All extension state lives here — API key, settings, cached selectors.
 */

export async function getApiKey() {
  const result = await chrome.storage.local.get("apiKey");
  return result.apiKey || null;
}

export async function setApiKey(key) {
  await chrome.storage.local.set({ apiKey: key });
}

export async function clearApiKey() {
  await chrome.storage.local.remove(["apiKey", "userInfo"]);
}

export async function getUserInfo() {
  const result = await chrome.storage.local.get("userInfo");
  return result.userInfo || null;
}

export async function setUserInfo(info) {
  await chrome.storage.local.set({ userInfo: info });
}

export async function getSettings() {
  const { DEFAULT_SETTINGS } = await import("./constants.js");
  const result = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

export async function updateSettings(partial) {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  await chrome.storage.local.set({ settings: merged });
  return merged;
}

export async function getCachedSelectors() {
  const result = await chrome.storage.local.get("selectorConfig");
  return result.selectorConfig || null;
}

export async function setCachedSelectors(config) {
  await chrome.storage.local.set({
    selectorConfig: config,
    selectorsFetchedAt: Date.now(),
  });
}
