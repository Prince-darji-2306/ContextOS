/**
 * RESPONSE CAPTURE — watches for new assistant messages and adds
 * a "Save to ContextOS" button next to each one.
 *
 * This module is injected AFTER the adapter and injector.
 * It uses the adapter's getResponses() method.
 *
 * Saving is opt-in only — never automatic.
 */

(async function () {
  "use strict";

  // Wait for adapter
  let adapter = null;
  let waited = 0;
  while (!adapter && waited < 10000) {
    adapter = window.__contextos_adapter;
    if (!adapter) {
      await new Promise((r) => setTimeout(r, 200));
      waited += 200;
    }
  }
  if (!adapter) return;

  const platform = adapter.getPlatform();
  const processedResponses = new WeakSet();

  function addSaveButton(responseEl) {
    if (processedResponses.has(responseEl)) return;
    processedResponses.add(responseEl);

    const btn = document.createElement("button");
    btn.className = "contextos-save-btn";
    btn.innerHTML = `<span class="contextos-save-icon">🧠</span> Save to ContextOS`;
    btn.title = "Save this response as a memory in ContextOS";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const content = responseEl.innerText || responseEl.textContent;
      if (!content || content.trim().length < 10) {
        btn.textContent = "Too short to save";
        setTimeout(() => {
          btn.innerHTML = `<span class="contextos-save-icon">🧠</span> Save to ContextOS`;
        }, 2000);
        return;
      }

      btn.disabled = true;
      btn.textContent = "Saving...";

      try {
        // Truncate to first 2000 chars for reasonable memory size
        const truncated = content.trim().substring(0, 2000);
        const result = await chrome.runtime.sendMessage({
          type: "REMEMBER",
          content: truncated,
          platform: platform,
          tags: ["llm-response", platform],
        });

        if (result.error) throw new Error(result.error);

        btn.innerHTML = `<span class="contextos-save-icon">✅</span> Saved!`;
        btn.classList.add("saved");
        setTimeout(() => {
          btn.innerHTML = `<span class="contextos-save-icon">🧠</span> Saved`;
          btn.disabled = true;
        }, 2000);
      } catch (err) {
        btn.textContent = "Error — try again";
        btn.disabled = false;
        console.error("[ContextOS] Save error:", err);
        setTimeout(() => {
          btn.innerHTML = `<span class="contextos-save-icon">🧠</span> Save to ContextOS`;
        }, 3000);
      }
    });

    // Insert the button after the response element
    // Position varies by platform — try to find a good anchor point
    const container =
      responseEl.closest("[data-message-author-role]") ||
      responseEl.closest(".message") ||
      responseEl.parentElement;

    if (container) {
      container.style.position = "relative";
      container.appendChild(btn);
    }
  }

  // Watch for new responses
  const observer = new MutationObserver(() => {
    const responses = adapter.getResponses();
    responses.forEach((el) => addSaveButton(el));
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Process existing responses
  setTimeout(() => {
    const responses = adapter.getResponses();
    responses.forEach((el) => addSaveButton(el));
  }, 2000);
})();
