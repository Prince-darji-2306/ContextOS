import {
  getApiKey,
  getUserInfo,
  getSettings,
  updateSettings,
} from "../utils/storage.js";

// ─── DOM Refs ─────────────────────────────────────────────────
const setupSection = document.getElementById("setup-section");
const connectedSection = document.getElementById("connected-section");
const apiKeyInput = document.getElementById("api-key-input");
const connectBtn = document.getElementById("connect-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const errorMsg = document.getElementById("error-msg");
const userName = document.getElementById("user-name");

const autoInjectToggle = document.getElementById("auto-inject-toggle");
const maxMemoriesSlider = document.getElementById("max-memories-slider");
const maxMemoriesValue = document.getElementById("max-memories-value");
const showBadgeToggle = document.getElementById("show-badge-toggle");

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const apiKey = await getApiKey();
  if (apiKey) {
    const userInfo = await getUserInfo();
    showConnected(userInfo);
  } else {
    showSetup();
  }

  // Load settings
  const settings = await getSettings();
  applySettingsToUI(settings);
});

// ─── Connect ──────────────────────────────────────────────────
connectBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showError("Please enter your API key");
    return;
  }
  if (!key.startsWith("ctx_os.")) {
    showError("Invalid key format. Keys start with ctx_os.");
    return;
  }

  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";
  hideError();

  try {
    const result = await chrome.runtime.sendMessage({
      type: "VALIDATE_KEY",
      apiKey: key,
    });

    if (result.error) throw new Error(result.error);
    showConnected(result);
  } catch (err) {
    showError(err.message || "Connection failed. Check your API key.");
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect";
  }
});

// ─── Disconnect ───────────────────────────────────────────────
disconnectBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "DISCONNECT" });
  showSetup();
});

// ─── Settings Listeners ───────────────────────────────────────
autoInjectToggle.addEventListener("change", () => {
  updateSettings({ autoInject: autoInjectToggle.checked });
});

maxMemoriesSlider.addEventListener("input", () => {
  maxMemoriesValue.textContent = maxMemoriesSlider.value;
  updateSettings({ maxMemories: parseInt(maxMemoriesSlider.value) });
});

showBadgeToggle.addEventListener("change", () => {
  updateSettings({ showBadge: showBadgeToggle.checked });
});

// Platform toggles
["chatgpt", "gemini", "grok", "claude-web"].forEach((platform) => {
  const el = document.getElementById(`platform-${platform}`);
  if (el) {
    el.addEventListener("change", async () => {
      const settings = await getSettings();
      settings.platforms[platform] = el.checked;
      updateSettings({ platforms: settings.platforms });
    });
  }
});

// ─── UI Helpers ───────────────────────────────────────────────
function showSetup() {
  setupSection.classList.remove("hidden");
  connectedSection.classList.add("hidden");
  apiKeyInput.value = "";
}

function showConnected(userInfo) {
  setupSection.classList.add("hidden");
  connectedSection.classList.remove("hidden");
  userName.textContent = `Connected as: ${userInfo?.display_name || "User"}`;
}

function applySettingsToUI(settings) {
  autoInjectToggle.checked = settings.autoInject;
  maxMemoriesSlider.value = settings.maxMemories;
  maxMemoriesValue.textContent = settings.maxMemories;
  showBadgeToggle.checked = settings.showBadge;

  Object.entries(settings.platforms).forEach(([platform, enabled]) => {
    const el = document.getElementById(`platform-${platform}`);
    if (el) el.checked = enabled;
  });
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}
