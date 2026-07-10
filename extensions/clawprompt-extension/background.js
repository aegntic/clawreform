// ═══════════════════════════════════════════════════════════════════════════════
// CLAWPROMPT — Background Service Worker v1.0.4
// 2026 Security Hardened — Sender Validated — Bidirectional OpenClaw + clawREFORM
// ═══════════════════════════════════════════════════════════════════════════════

const EXTENSION_VERSION = "1.0.4";
const MODE = "SECURE bidirectional OpenClaw + clawREFORM + CLI Sync";

// CLI endpoint for local sync (default ClawReform daemon port)
const CLI_ENDPOINT = "http://127.0.0.1:4332";
let cliStatus = { connected: false, lastSync: null, agentCount: 0 };

// ═══════════════════════════════════════════════════════════════════════════════
// Allowed Origins for External Messages (2026 Security Requirement)
// ═══════════════════════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  "https://clawreform.com",
  "https://www.clawreform.com",
  "https://open-claw.org",
  "https://www.open-claw.org"
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed ||
    origin.endsWith('.' + allowed.replace('https://', '').replace('www.', ''))
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// External Message Handler (OpenClaw/clawREFORM Integration)
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // 2026 SECURITY HARDENING — MANDATORY SENDER VALIDATION
  const origin = sender.origin || (sender.url ? new URL(sender.url).origin : null);

  if (!isOriginAllowed(origin)) {
    console.warn("[ClawPrompt] Blocked unauthorized external message from:", origin);
    sendResponse({ status: "blocked", reason: "origin_not_allowed" });
    return false;
  }

  console.log("[ClawPrompt] Verified message from:", origin, message.action);

  // ═══ Handle Prompt Injection ═══
  if (message.action === "injectPrompt" && message.text) {
    handleInjectPrompt(message.text, origin)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ status: "error", error: error.message }));
    return true; // Async response
  }

  // ═══ Handle Chat Capture (Bidirectional) ═══
  if (message.action === "captureChat") {
    handleCaptureChat(origin)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ status: "error", error: error.message }));
    return true; // Async response
  }

  // ═══ Handle Ping/Health Check ═══
  if (message.action === "ping") {
    sendResponse({
      status: "alive",
      version: EXTENSION_VERSION,
      mode: MODE,
      security: "sender-validated",
      capabilities: ["injectPrompt", "captureChat", "ping"],
      timestamp: new Date().toISOString()
    });
    return false;
  }

  // Unknown action
  sendResponse({ status: "error", error: "Unknown action" });
  return false;
});

// ═══════════════════════════════════════════════════════════════════════════════
// Prompt Injection Logic
// ═══════════════════════════════════════════════════════════════════════════════

async function handleInjectPrompt(promptText, verifiedOrigin) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const targetTab = tabs[0];

    if (!targetTab) {
      return { status: "error", error: "No active tab found" };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: (text) => {
        const selectors = [
          'textarea:not([readonly])',
          '[contenteditable="true"]',
          'div[role="textbox"]',
          '#prompt-textarea',
          '.ProseMirror[contenteditable="true"]'
        ];

        let injected = false;

        for (let sel of selectors) {
          try {
            const elements = document.querySelectorAll(sel);
            for (let el of elements) {
              if (el && !el.disabled && el.offsetParent !== null) {
                el.focus();
                el.click();

                if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                  const setter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 'value'
                  )?.set;
                  if (setter) setter.call(el, text);
                  else el.value = text;
                } else {
                  el.textContent = '';
                  el.focus();
                  document.execCommand('insertText', false, text);
                }

                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));

                injected = true;
                break;
              }
            }
            if (injected) break;
          } catch (e) { continue; }
        }

        if (!injected) {
          navigator.clipboard.writeText(text);
          return { success: true, method: 'clipboard' };
        }

        return { success: true, method: 'direct' };
      },
      args: [promptText]
    });

    const result = results?.[0]?.result;

    // Log to CLI (async, non-blocking)
    logPromptToCLI(promptText, "external", targetTab.url).catch(() => {});

    return {
      status: "injected",
      version: EXTENSION_VERSION,
      tabId: targetTab.id,
      tabUrl: targetTab.url,
      method: result?.method || 'direct',
      verifiedOrigin: verifiedOrigin
    };

  } catch (error) {
    console.error("[ClawPrompt] Injection error:", error);
    return { status: "error", error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chat Capture Logic (Bidirectional)
// ═══════════════════════════════════════════════════════════════════════════════

async function handleCaptureChat(verifiedOrigin) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const targetTab = tabs[0];

    if (!targetTab) {
      return { status: "error", error: "No active tab found" };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: () => {
        const url = location.href;
        let provider = 'unknown';
        let messages = [];

        // Detect provider
        if (url.includes('chatgpt.com') || url.includes('openai.com')) provider = 'chatgpt';
        else if (url.includes('claude.ai')) provider = 'claude';
        else if (url.includes('grok.x.ai') || url.includes('x.ai')) provider = 'grok';
        else if (url.includes('gemini.google.com')) provider = 'gemini';

        // Multi-LLM scraper
        const chatBlocks = document.querySelectorAll(
          'div[data-message-author-role], [data-testid*="conversation"], .prose, article, .chat-message, .message, [role="article"]'
        );

        chatBlocks.forEach(block => {
          const text = block.innerText?.trim();
          if (text && text.length > 10) {
            const role = block.getAttribute('data-message-author-role') ||
                        (block.closest('[data-testid*="assistant"]') ? 'assistant' :
                         block.closest('[data-testid*="user"]') ? 'user' : 'unknown');
            messages.push({ role, text: text.substring(0, 4000) });
          }
        });

        // Fallback: capture main content
        if (messages.length < 2) {
          const main = document.querySelector('main, [role="main"], .chat-container') || document.body;
          const fullText = main.innerText?.trim();
          if (fullText) {
            messages = [{ role: 'full', text: fullText.substring(0, 12000) }];
          }
        }

        // Limit to last 20 messages
        messages = messages.slice(-20);

        return {
          provider,
          messages,
          url,
          timestamp: Date.now(),
          title: document.title
        };
      }
    });

    const capturedData = results?.[0]?.result;

    // Send to CLI for context/memory (async, non-blocking)
    if (capturedData) {
      sendChatToCLI(capturedData, targetTab.url).catch(() => {});
    }

    return {
      status: "captured",
      version: EXTENSION_VERSION,
      data: capturedData,
      verifiedOrigin: verifiedOrigin,
      tabId: targetTab.id
    };

  } catch (error) {
    console.error("[ClawPrompt] Capture error:", error);
    return { status: "error", error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Internal Message Handler (from popup)
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureChat") {
    handleCaptureChat("popup")
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ status: "error", error: error.message }));
    return true;
  }

  if (message.action === "getVersion") {
    sendResponse({ version: EXTENSION_VERSION, mode: MODE });
    return false;
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLI Sync Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sync with local ClawReform CLI daemon
 * @param {Object} data - Data to send to CLI
 * @returns {Promise<Object>} CLI response
 */
async function syncWithCLI(data = {}) {
  try {
    const response = await fetch(`${CLI_ENDPOINT}/api/extension/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: EXTENSION_VERSION,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`CLI returned ${response.status}`);
    }

    const result = await response.json();
    cliStatus = {
      connected: true,
      lastSync: new Date().toISOString(),
      agentCount: result.active_agents || 0,
      healthy: result.healthy,
      message: result.message
    };

    console.log("[ClawPrompt] CLI sync successful:", result.message);
    return { success: true, data: result };

  } catch (error) {
    cliStatus.connected = false;
    console.log("[ClawPrompt] CLI not available:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Log an injected prompt to CLI for mission tracking
 */
async function logPromptToCLI(promptText, promptTitle, tabUrl) {
  const result = await syncWithCLI({
    current_tab: tabUrl,
    injected_prompt: promptText
  });

  if (result.success) {
    console.log(`[ClawPrompt] Logged prompt to CLI: ${promptTitle}`);
  }

  return result;
}

/**
 * Send captured chat to CLI for context/memory
 */
async function sendChatToCLI(chatData, tabUrl) {
  const result = await syncWithCLI({
    current_tab: tabUrl,
    captured_chat: chatData
  });

  if (result.success) {
    console.log("[ClawPrompt] Sent chat capture to CLI");
  }

  return result;
}

/**
 * Periodic heartbeat to CLI (every 30 seconds)
 */
function startCLIHeartbeat() {
  // Initial sync
  syncWithCLI();

  // Periodic sync
  setInterval(() => {
    syncWithCLI().catch(err => {
      console.log("[ClawPrompt] Heartbeat failed:", err.message);
    });
  }, 30000);
}

// Start CLI heartbeat on service worker start
startCLIHeartbeat();

// ═══════════════════════════════════════════════════════════════════════════════
// Installation Handler
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log(`[ClawPrompt] v${EXTENSION_VERSION} installed — ${MODE}`);
  } else if (details.reason === "update") {
    console.log(`[ClawPrompt] Updated to v${EXTENSION_VERSION}`);
  }
});

console.log(`[ClawPrompt] Service Worker v${EXTENSION_VERSION} started — ${MODE}`);
