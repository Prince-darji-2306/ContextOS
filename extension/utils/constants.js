// Change this to your production URL before publishing
export const API_BASE_URL = "http://localhost:8000";

export const DEFAULT_SETTINGS = {
  autoInject: true,
  maxMemories: 5,
  showBadge: true,
  platforms: {
    chatgpt: true,
    gemini: true,
    grok: true,
    "claude-web": true,
  },
};

export const SELECTOR_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
