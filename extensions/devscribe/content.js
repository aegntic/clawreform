(function () {
  "use strict";

  if (window.__devscribe_injected) return;
  window.__devscribe_injected = true;

  // ─── Console Ring Buffer ───────────────────────────────────────────────
  const consoleBuffer = [];
  const MAX_CONSOLE = 100;
  const origConsole = { log: console.log, warn: console.warn, error: console.error };

  ["log", "warn", "error"].forEach((level) => {
    console[level] = function (...args) {
      origConsole[level].apply(console, args);
      consoleBuffer.push({ level, args: args.map((a) => serializeArg(a)), ts: Date.now() });
      if (consoleBuffer.length > MAX_CONSOLE) consoleBuffer.shift();
    };
  });

  function serializeArg(a) {
    if (a instanceof Error) return a.message;
    if (typeof a === "object") {
      try { return JSON.stringify(a, null, 2); } catch { return String(a); }
    }
    return String(a);
  }

  // ─── Network Ring Buffer ───────────────────────────────────────────────
  const networkBuffer = [];
  const MAX_NETWORK = 50;

  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : (input instanceof Request ? input.url : String(input));
    const method = (init && init.method) || (input instanceof Request && input.method) || "GET";
    if (!/\/api\//.test(url)) return origFetch.apply(this, arguments);
    const start = performance.now();
    return origFetch.apply(this, arguments).then(
      (resp) => {
        pushNetwork({ url, method, status: resp.status, ms: performance.now() - start, ts: Date.now() });
        return resp;
      },
      (err) => {
        pushNetwork({ url, method, status: 0, ms: performance.now() - start, ts: Date.now(), error: err.message });
        throw err;
      }
    );
  };

  const origXHROpen = XMLHttpRequest.prototype.open;
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__ds = { method, url: String(url) };
    return origXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const meta = this.__ds;
    if (meta && /\/api\//.test(meta.url)) {
      const start = performance.now();
      this.addEventListener("loadend", () => {
        pushNetwork({
          url: meta.url,
          method: meta.method,
          status: this.status,
          ms: performance.now() - start,
          ts: Date.now(),
        });
      });
    }
    return origXHRSend.apply(this, arguments);
  };

  function pushNetwork(entry) {
    networkBuffer.push(entry);
    if (networkBuffer.length > MAX_NETWORK) networkBuffer.shift();
  }

  // ─── Message Passing ───────────────────────────────────────────────────
  function sendToBackground(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...(payload || {}) }, (resp) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(resp);
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !msg.type) return false;
    switch (msg.type) {
      case "GET_STATE":
        sendResponse(getAppState());
        break;
      case "GET_NOTES_SYNC":
        sendToBackground("GET_NOTES").then(sendResponse);
        return true;
      case "OPEN_PANEL":
        expandPanel();
        sendResponse({ success: true });
        break;
      case "TOGGLE_ELEMENT_SELECT":
        if (state.selectingElement) finishSelection(null);
        else startElementSelection();
        sendResponse({ success: true, data: state.selectingElement });
        break;
      case "TRIGGER_CAPTURE":
        handleCaptureAction(msg.action);
        sendResponse({ success: true });
        break;
      case "GET_ALPINE_STATE":
        sendResponse({ success: true, data: getAppState().alpine });
        break;
      default:
        sendResponse({ success: false, error: "Unknown type" });
    }
    return false;
  });

  // ─── Alpine.js Integration ─────────────────────────────────────────────
  function getAppState() {
    const hash = window.location.hash || "#/";
    let alpineStore = null;
    try {
      if (window.Alpine && typeof Alpine.store === "function") {
        const s = Alpine.store("app");
        if (s) {
          alpineStore = {
            page: s.page || s.currentPage || null,
            agents: s.agents || null,
            agentsCount: Array.isArray(s.agents) ? s.agents.length : (s.agentCount ?? null),
            connected: s.connected ?? null,
            devMode: s.devMode ?? false,
            version: s.version || null,
          };
        }
      }
    } catch { /* Alpine not ready */ }
    let apiAvailable = false;
    try { apiAvailable = !!(window.ClawReformAPI || window.clawreformApi); } catch {}
    return { hash, alpine: alpineStore, apiAvailable, url: location.href };
  }

  // ─── Internal State ────────────────────────────────────────────────────
  const state = {
    notes: [],
    selectingElement: false,
    tooltipEnabled: true,
    searchQuery: "",
    searchHistory: [],
    searchFilters: { type: "all", dateRange: "all" },
  };

  // ─── Inject Fonts ──────────────────────────────────────────────────────
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(fontLink);

  // ─── Build Shadow DOM ──────────────────────────────────────────────────
  const host = document.createElement("div");
  host.id = "devscribe-host";
  host.style.cssText = "all:initial;position:fixed;bottom:12px;right:12px;z-index:999999;";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  // ─── Styles — Gold Metallic / Brushed Gunmetal / Silver Emboss ──────────
  const style = document.createElement("style");
  style.textContent = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    /* ── Gradients ── */
    /* Gold metallic: rich 3D gold with specular highlight */
    .gold-metal{
      background:
        linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 40%, rgba(255,255,255,0.12) 60%, transparent 100%),
        linear-gradient(180deg, #ffd700 0%, #fff8dc 18%, #daa520 38%, #b8860b 58%, #daa520 78%, #ffd700 100%);
    }
    /* Brushed gunmetal: dark steel with fine horizontal grain + metal sheen */
    .gunmetal{
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.018) 1px, rgba(255,255,255,0.018) 2px),
        linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 30%, rgba(0,0,0,0.12) 100%),
        #181b28;
    }
    /* Silver emboss: text looks stamped into metal */
    .silver-text{
      background:linear-gradient(180deg, #f8f8ff 0%, #d0d0e0 45%, #a0a0b8 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
      filter:drop-shadow(0 1px 0 rgba(255,255,255,0.55)) drop-shadow(0 -1px 0 rgba(0,0,0,0.7));
    }

    /* ── Panel ── */
    .panel{
      width:390px;max-height:540px;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px),
        linear-gradient(180deg, #1e2236 0%, #141726 40%, #0e1020 100%);
      color:#e0e0f0;font-family:'Manrope',-apple-system,system-ui,sans-serif;
      border:1px solid rgba(255,215,0,0.22);
      border-radius:18px;display:flex;flex-direction:column;
      box-shadow:
        0 1px 0 rgba(255,215,0,0.12),
        0 0 0 1px rgba(0,0,0,0.6),
        0 26px 56px rgba(0,0,0,0.62), 0 10px 22px rgba(0,0,0,0.42),
        inset 0 1px 0 rgba(255,255,255,0.09);
      font-size:13px;line-height:1.5;overflow:hidden;
      animation:scaleIn 0.2s cubic-bezier(0.34,1.56, 0.64,1);
    }
    .panel.collapsed{display:none}

    /* ── FAB — pure gold coin ── */
    .fab{
      width:48px;height:48px;border-radius:50%;
      background:
        radial-gradient(ellipse 55% 40% at 40% 30%, rgba(255,255,255,0.55) 0%, transparent 70%),
        linear-gradient(135deg, #b8860b 0%, #daa520 20%, #ffd700 40%, #fff8dc 50%, #ffd700 60%, #daa520 80%, #b8860b 100%);
      border:2px solid rgba(255,248,220,0.5);
      cursor:pointer;color:#3d2b00;font-size:18px;font-weight:900;
      font-family:'Manrope',sans-serif;line-height:48px;text-align:center;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.6),
        0 0 20px rgba(255,215,0,0.35),
        0 8px 20px rgba(0,0,0,0.5),
        inset 0 -2px 4px rgba(139,105,20,0.5),
        inset 0 2px 4px rgba(255,255,255,0.3);
      transition:transform 0.15s,box-shadow 0.15s;
      position:fixed;bottom:12px;right:12px;letter-spacing:-0.5px;
      text-shadow:0 1px 0 rgba(255,255,255,0.4);
    }
    .fab:hover{
      transform:translateY(-2px) scale(1.08);
      box-shadow:0 1px 0 rgba(255,255,255,0.6),0 0 30px rgba(255,215,0,0.5),0 12px 28px rgba(0,0,0,0.5),inset 0 -2px 4px rgba(139,105,20,0.5),inset 0 2px 4px rgba(255,255,255,0.3);
    }

    /* ── Header — brushed gunmetal bar ── */
    .handle{
      height:42px;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px),
        linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.18) 100%),
        #1c1f30;
      border-bottom:1px solid rgba(255,215,0,0.18);
      display:flex;align-items:center;justify-content:space-between;padding:0 14px;
      cursor:grab;user-select:none;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.3);
    }
    .handle:active{cursor:grabbing}
    .handle-title{
      font-weight:800;font-size:11px;letter-spacing:1.6px;font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, #fff8dc 0%, #ffd700 40%, #b8860b 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      filter:drop-shadow(0 1px 0 rgba(0,0,0,0.7)) drop-shadow(0 0 6px rgba(255,215,0,0.3));
    }
    .handle-btns{display:flex;gap:6px}
    .handle-btn{
      width:24px;height:24px;border:none;border-radius:999px;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px),
        linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.15) 100%),
        #222538;
      color:#8888aa;cursor:pointer;
      font-size:13px;display:flex;align-items:center;justify-content:center;
      border:1px solid rgba(255,215,0,0.12);
      box-shadow:inset 0 2px 4px rgba(0,0,0,0.5), inset -1px -1px 0 rgba(255,255,255,0.04);
      transition:all 0.15s;
    }
    .handle-btn:hover{
      border-color:rgba(255,215,0,0.35);color:#ffd700;
      box-shadow:inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,215,0,0.2);
    }

    /* ── Tabs ── */
    .tabs{
      display:flex;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.012) 1px, rgba(255,255,255,0.012) 2px),
        linear-gradient(180deg, #12151f 0%, #0c0e18 100%);
      border-bottom:1px solid rgba(255,215,0,0.10);
    }
    .tab{
      flex:1;padding:8px 0;border:none;background:transparent;
      color:#555570;cursor:pointer;font-size:12px;font-weight:600;
      font-family:'Manrope',sans-serif;letter-spacing:0.3px;
      border-bottom:2px solid transparent;
      transition:all 0.15s;
    }
    .tab.active{
      color:#ffd700;border-bottom-color:#ffd700;
      text-shadow:0 0 8px rgba(255,215,0,0.3);
    }
    .tab:hover{color:#a0a0c0}

    /* ── Body ── */
    .body{flex:1;overflow-y:auto;padding:12px}
    .body::-webkit-scrollbar{width:5px}
    .body::-webkit-scrollbar-thumb{background:#2a2d40;border-radius:3px}
    .pane{display:none}.pane.active{display:block}

    /* ── Labels — silver etched ── */
    label{
      display:block;font-size:10px;margin:10px 0 4px;
      text-transform:uppercase;letter-spacing:0.8px;font-weight:600;
      font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, #c0c0d8 0%, #8080a0 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      filter:drop-shadow(0 1px 0 rgba(255,255,255,0.3)) drop-shadow(0 -1px 0 rgba(0,0,0,0.6));
    }
    label:first-child{margin-top:0}

    /* ── Inputs — debossed gunmetal wells ── */
    input,textarea,select{
      width:100%;padding:9px 12px;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.01) 1px, rgba(255,255,255,0.01) 2px),
        linear-gradient(180deg, #0a0c16 0%, #121520 100%);
      color:#e0e0f0;
      border:1px solid rgba(255,215,0,0.12);
      border-radius:14px;font-size:13px;font-family:'Manrope',sans-serif;
      outline:none;
      box-shadow:inset 0 4px 10px rgba(0,0,0,0.7), inset 0 1px 3px rgba(0,0,0,0.5), inset -1px -1px 0 rgba(255,255,255,0.03);
      transition:border-color 0.2s,box-shadow 0.2s;
    }
    input:focus,textarea:focus,select:focus{
      border-color:rgba(255,215,0,0.4);
      box-shadow:inset 0 4px 10px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,215,0,0.15), 0 0 12px rgba(255,215,0,0.1);
    }
    input::placeholder,textarea::placeholder{color:#444460}
    textarea{min-height:64px;resize:vertical;font-family:'Manrope',sans-serif}
    select{cursor:pointer}

    /* ── Buttons ── */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:4px;
      min-height:32px;padding:6px 14px;
      border:1px solid rgba(255,215,0,0.2);
      border-radius:999px;cursor:pointer;
      font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;letter-spacing:-0.01em;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px),
        linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(0,0,0,0.12) 100%),
        #1e2138;
      color:#c0c0d8;
      box-shadow:0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
      transition:transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    }
    .btn:hover{
      transform:translateY(-1px);
      border-color:rgba(255,215,0,0.4);
      box-shadow:0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(255,215,0,0.15);
    }
    .btn:active{transform:translateY(1px) scale(0.985);box-shadow:inset 0 3px 8px rgba(0,0,0,0.5)}

    /* Gold primary button — full metallic gold */
    .btn-primary{
      background:
        radial-gradient(ellipse 60% 50% at 35% 25%, rgba(255,255,255,0.35) 0%, transparent 70%),
        linear-gradient(135deg, #b8860b 0%, #daa520 20%, #ffd700 40%, #fff8dc 50%, #ffd700 60%, #daa520 80%, #b8860b 100%);
      border:1px solid rgba(255,248,220,0.5);
      color:#3d2b00;font-weight:700;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.6),
        0 8px 20px rgba(184,134,11,0.35),
        0 0 18px rgba(255,215,0,0.2),
        inset 0 -2px 4px rgba(139,105,20,0.4),
        inset 0 2px 4px rgba(255,255,255,0.4);
      text-shadow:0 1px 0 rgba(255,255,255,0.5);
    }
    .btn-primary:hover{
      border-color:rgba(255,248,220,0.7);
      box-shadow:0 1px 0 rgba(255,255,255,0.6), 0 12px 28px rgba(184,134,11,0.45), 0 0 24px rgba(255,215,0,0.3), inset 0 -2px 4px rgba(139,105,20,0.4), inset 0 2px 4px rgba(255,255,255,0.4);
    }

    .btn-sm{min-height:28px;padding:5px 10px;font-size:11px}

    /* Ghost button — deep debossed gunmetal */
    .btn-ghost{
      background:
        linear-gradient(180deg, #0e1020 0%, #161a2a 100%);
      border-color:rgba(255,215,0,0.08);color:#8888aa;
      box-shadow:inset 0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(0,0,0,0.4);
    }
    .btn-ghost:hover{
      border-color:rgba(255,215,0,0.3);color:#ffd700;
      box-shadow:inset 0 3px 8px rgba(0,0,0,0.6), 0 0 8px rgba(255,215,0,0.12);
    }

    .btn-danger{
      background:
        radial-gradient(ellipse 60% 50% at 35% 25%, rgba(255,255,255,0.2) 0%, transparent 70%),
        linear-gradient(180deg, #ffdadf 0%, #c0392b 100%);
      border:1px solid rgba(240,113,120,0.4);color:#18080b;font-weight:700;
      box-shadow:0 1px 0 rgba(255,255,255,0.3), 0 6px 16px rgba(192,57,43,0.3), inset 0 -1px 2px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3);
    }
    .btn-danger:hover{border-color:#f07178}
    .btn-row{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}

    /* ── Note Cards — gunmetal panels ── */
    .note-card{
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.012) 1px, rgba(255,255,255,0.012) 2px),
        linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.08) 100%),
        #181b2a;
      color:#e0e0f0;
      border:1px solid rgba(255,215,0,0.14);
      border-radius:14px;padding:10px 12px;margin-bottom:8px;position:relative;
      box-shadow:0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3);
      transition:border-color 0.15s, transform 0.15s;
      animation:slideUp 0.2s;
    }
    .note-card:hover{
      border-color:rgba(255,215,0,0.3);
      transform:translateY(-1px);
      box-shadow:0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.4), 0 0 8px rgba(255,215,0,0.08);
    }
    .note-card-header{display:flex;align-items:center;gap:6px;margin-bottom:4px}
    .note-title{
      font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, #f0f0ff 0%, #b0b0c8 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      filter:drop-shadow(0 1px 0 rgba(255,255,255,0.4)) drop-shadow(0 -1px 0 rgba(0,0,0,0.6));
    }

    /* ── Badges — metallic pill stamps ── */
    .badge{
      display:inline-flex;align-items:center;gap:3px;
      padding:3px 9px;border-radius:999px;
      font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;
      font-family:'Manrope',sans-serif;
      border:1px solid rgba(255,255,255,0.1);
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3);
    }
    .badge-bug{background:rgba(240,113,120,0.18);color:#f07178;text-shadow:0 0 6px rgba(240,113,120,0.3)}
    .badge-feature{background:rgba(87,211,155,0.18);color:#57d39b;text-shadow:0 0 6px rgba(87,211,155,0.3)}
    .badge-debt{background:rgba(242,187,88,0.18);color:#f2bb58;text-shadow:0 0 6px rgba(242,187,88,0.3)}
    .badge-performance{background:rgba(120,176,255,0.18);color:#78b0ff;text-shadow:0 0 6px rgba(120,176,255,0.3)}
    .badge-observation{background:rgba(165,142,240,0.18);color:#a58ef0;text-shadow:0 0 6px rgba(165,142,240,0.3)}

    .note-meta{
      font-size:10px;display:flex;gap:8px;font-family:'IBM Plex Mono',monospace;
      background:linear-gradient(180deg, #606080 0%, #404060 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .note-body{
      font-size:12px;margin-top:4px;
      white-space:pre-wrap;word-break:break-word;max-height:60px;overflow-y:auto;
      font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, #9090a8 0%, #606080 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .note-actions{display:flex;gap:4px;margin-top:8px;justify-content:flex-end}

    /* ── Key-Value Rows ── */
    .kv{
      display:flex;justify-content:space-between;align-items:center;
      padding:6px 0;border-bottom:1px solid rgba(255,215,0,0.06);
    }
    .kv-key{
      font-size:11px;font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, #9090a8 0%, #606080 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .kv-val{
      font-size:11px;font-weight:700;font-family:'IBM Plex Mono',monospace;
      background:linear-gradient(180deg, #fff8dc 0%, #ffd700 50%, #b8860b 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      filter:drop-shadow(0 0 4px rgba(255,215,0,0.3));
    }

    /* ── Capture Grid ── */
    .capture-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .capture-grid .btn{width:100%;text-align:center;padding:12px 8px;font-size:11px;flex-direction:column;gap:4px}

    /* ── Selection Overlay ── */
    .ds-overlay{
      position:fixed;pointer-events:none;z-index:999998;
      background:rgba(255,215,0,0.10);border:2px solid #ffd700;
      border-radius:6px;transition:all 0.08s;display:none;
      box-shadow:0 0 0 1px rgba(255,215,0,0.15), 0 0 18px rgba(255,215,0,0.2), 0 0 40px rgba(255,215,0,0.08);
    }

    /* ── Empty ── */
    .empty{
      text-align:center;padding:28px 12px;font-size:12px;font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, #555570 0%, #3a3a55 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }

    /* ── Log entries ── */
    .log-entry{
      font-family:'IBM Plex Mono',monospace;font-size:11px;padding:4px 0;
      border-bottom:1px solid rgba(255,215,0,0.05);word-break:break-all;color:#8888aa;
    }
    .log-entry .lvl-warn{color:#f2bb58;text-shadow:0 0 4px rgba(242,187,88,0.2)}
    .log-entry .lvl-error{color:#f07178;text-shadow:0 0 4px rgba(240,113,120,0.2)}
    .log-entry .lvl-log{color:#8888aa}

    /* ── Scroll ── */
    .scroll-list{max-height:280px;overflow-y:auto}
    .scroll-list::-webkit-scrollbar{width:4px}
    .scroll-list::-webkit-scrollbar-thumb{background:#2a2d40;border-radius:2px}

    /* ── Divider ── */
    .divider{
      height:1px;margin:12px 0;
      background:linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.2) 50%, transparent 100%);
    }

    /* ── Animations ── */
    @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
    @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    /* ── Hover Tooltip ── */
    .hover-tooltip{
      position:fixed;z-index:999997;
      max-width:320px;padding:10px 14px;
      background:
        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px),
        linear-gradient(180deg, #1e2236 0%, #141726 40%, #0e1020 100%);
      border:1px solid rgba(255,215,0,0.22);
      border-radius:12px;
      color:#e0e0f0;font-family:'Manrope',sans-serif;font-size:11px;line-height:1.5;
      box-shadow:0 1px 0 rgba(255,215,0,0.12),0 8px 24px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.09);
      pointer-events:none;opacity:0;transition:opacity 0.15s;
    }
    .hover-tooltip.visible{opacity:1}
    .hover-tooltip-title{
      font-weight:700;font-size:12px;margin-bottom:6px;
      background:linear-gradient(180deg, #fff8dc 0%, #ffd700 40%, #b8860b 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hover-tooltip-section{padding:4px 0;border-top:1px solid rgba(255,215,0,0.08)}
    .hover-tooltip-section:first-child{border-top:none;padding-top:0}
    .hover-tooltip-label{
      font-size:9px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;
      background:linear-gradient(180deg, #606080 0%, #404060 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hover-tooltip-value{
      font-family:'IBM Plex Mono',monospace;font-size:10px;
      background:linear-gradient(180deg, #c0c0d8 0%, #9090a8 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      word-break:break-all;
    }
    .hover-tooltip .badge{margin:2px 4px 2px 0;font-size:8px;padding:2px 6px}

    /* ── Search Tab ── */
    .search-input-wrap{position:relative;margin-bottom:8px}
    .search-input-wrap input{padding-right:26px}
    .search-clear{
      position:absolute;right:8px;top:50%;transform:translateY(-50%);
      width:20px;height:20px;border:none;border-radius:50%;
      background:transparent;color:#555570;cursor:pointer;font-size:14px;
      display:flex;align-items:center;justify-content:center;
    }
    .search-clear:hover{color:#ffd700}
    .search-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
    .search-filter{
      padding:4px 10px;border-radius:999px;font-size:10px;font-weight:600;
      background:linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.08) 100%), #181b2a;
      border:1px solid rgba(255,215,0,0.12);color:#8888aa;cursor:pointer;
      transition:all 0.15s;
    }
    .search-filter.active{
      border-color:rgba(255,215,0,0.4);color:#ffd700;
      box-shadow:0 0 8px rgba(255,215,0,0.15);
    }
    .search-history{margin-top:8px}
    .search-history-title{
      font-size:9px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;
      background:linear-gradient(180deg, #606080 0%, #404060 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      margin-bottom:4px
    }
    .search-history-item{
      padding:6px 8px;border-radius:8px;cursor:pointer;
      font-size:11px;color:#8888aa;
      transition:all 0.15s;
    }
    .search-history-item:hover{
      background:rgba(255,215,0,0.08);color:#e0e0f0;
    }
    .search-result-count{
      font-size:10px;margin-bottom:6px;
      background:linear-gradient(180deg, #606080 0%, #404060 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
  `;
  root.appendChild(style);

  // ─── Selector Overlay ──────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.className = "ds-overlay";
  document.body.appendChild(overlay);

  // ─── Hover Tooltip ──────────────────────────────────────────────
  const hoverTooltip = document.createElement("div");
  hoverTooltip.className = "hover-tooltip";
  root.appendChild(hoverTooltip);

  let tooltipTimeout = null;
  let tooltipEnabled = true;

  // Load tooltip setting
  sendToBackground("GET_SETTINGS").then((resp) => {
    if (resp?.success && resp.data?.tooltip_enabled !== undefined) {
      tooltipEnabled = resp.data.tooltip_enabled;
    }
  });

  function showTooltip(x, y, content) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      hoverTooltip.innerHTML = content;
      hoverTooltip.classList.add("visible");

      const rect = hoverTooltip.getBoundingClientRect();
      let left = x + 12;
      let top = y + 12;

      if (left + rect.width > window.innerWidth - 12) {
        left = x - rect.width - 12;
      }
      if (top + rect.height > window.innerHeight - 12) {
        top = y - rect.height - 12;
      }

      hoverTooltip.style.left = Math.max(12, left) + "px";
      hoverTooltip.style.top = Math.max(12, top) + "px";
    }, 300);
  }

  function hideTooltip() {
    clearTimeout(tooltipTimeout);
    hoverTooltip.classList.remove("visible");
  }

  function analyzeElement(el) {
    if (!el || host.contains(el)) return null;

    const info = {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className && typeof el.className === "string"
        ? el.className.trim().split(/\s+/).filter(c => c && !c.startsWith("ds-"))
        : [],
      ariaLabel: el.getAttribute("aria-label"),
      role: el.getAttribute("role"),
      dataAttrs: {},
      alpine: null,
      apiEndpoint: null,
      agentInfo: null,
    };

    for (const attr of el.attributes || []) {
      if (attr.name.startsWith("data-")) {
        info.dataAttrs[attr.name] = attr.value;
      }
    }

    // Alpine.js bindings
    try {
      const alpineAttrs = [];
      for (const attr of el.attributes || []) {
        if (attr.name.startsWith("x-") || attr.name.startsWith("@") || attr.name.startsWith(":")) {
          alpineAttrs.push({ name: attr.name, value: attr.value.slice(0, 50) });
        }
      }
      if (alpineAttrs.length) {
        info.alpine = alpineAttrs;
      }

      if (el.__x && el.__x.$data) {
        const data = el.__x.$data;
        info.alpine = info.alpine || [];
        const keys = Object.keys(data).filter(k => !k.startsWith("$")).slice(0, 5);
        if (keys.length) {
          info.alpine.push({ name: "x-data keys", value: keys.join(", ") });
        }
      }
    } catch {}

    // API endpoint detection
    const apiPatterns = [
      { regex: /\/api\/agents\/?/i, label: "Agents API" },
      { regex: /\/api\/budget\/?/i, label: "Budget API" },
      { regex: /\/api\/network\/?/i, label: "Network API" },
      { regex: /\/api\/a2a\/?/i, label: "A2A API" },
      { regex: /\/api\/peers\/?/i, label: "Peers API" },
      { regex: /\/api\/health\/?/i, label: "Health API" },
    ];

    const checkApiEndpoint = (str) => {
      if (!str) return null;
      for (const p of apiPatterns) {
        if (p.regex.test(str)) return p.label;
      }
      return null;
    }

    info.apiEndpoint = checkApiEndpoint(el.href || el.action ||
      el.getAttribute("data-url") || el.getAttribute("data-endpoint") ||
      el.getAttribute("data-api") || el.getAttribute("data-href"));

    // Agent info detection
    if (el.closest && el.closest("[data-agent-id]")) {
      info.agentInfo = {
        id: el.closest("[data-agent-id]").getAttribute("data-agent-id"),
        name: el.closest("[data-agent-name]")?.getAttribute("data-agent-name"),
      }
    }

    return info
  }

  function buildTooltipContent(info) {
    if (!info) return ""

    let html = '<div class="hover-tooltip-title">Element: ' + esc(info.tag) + '</div>'

    let basicInfo = []
    if (info.id) basicInfo.push('<div class="hover-tooltip-label">ID</div><div class="hover-tooltip-value">#' + esc(info.id) + '</div>')
    if (info.classes.length) basicInfo.push('<div class="hover-tooltip-label">Classes</div><div class="hover-tooltip-value">.' + esc(info.classes.slice(0, 5).join(" .")) + '</div>')
    if (info.ariaLabel) basicInfo.push('<div class="hover-tooltip-label">Aria Label</div><div class="hover-tooltip-value">' + esc(info.ariaLabel) + '</div>')
    if (info.role) basicInfo.push('<div class="hover-tooltip-label">Role</div><div class="hover-tooltip-value">' + esc(info.role) + '</div>')

    if (basicInfo.length) {
      html += '<div class="hover-tooltip-section">' + basicInfo.join("") + '</div>'
    }

    if (info.alpine && info.alpine.length) {
      html += '<div class="hover-tooltip-section"><div class="hover-tooltip-label">Alpine.js Bindings</div>'
      info.alpine.forEach(a => {
        html += '<div class="hover-tooltip-value">' + esc(a.name) + '="' + esc(a.value) + '"</div>'
      })
      html += '</div>'
    }

    const dataKeys = Object.keys(info.dataAttrs)
    if (dataKeys.length) {
      html += '<div class="hover-tooltip-section"><div class="hover-tooltip-label">Data Attributes</div>'
      dataKeys.slice(0, 4).forEach(k => {
        html += '<div class="hover-tooltip-value">' + esc(k) + ': ' + esc(info.dataAttrs[k].slice(0, 30)) + '</div>'
      })
      if (dataKeys.length > 4) {
        html += '<div class="hover-tooltip-value">+ ' + (dataKeys.length - 4) + ' more</div>'
      }
      html += '</div>'
    }

    if (info.apiEndpoint) {
      html += '<div class="hover-tooltip-section"><div class="hover-tooltip-label">API Endpoint</div>'
      html += '<span class="badge badge-feature">' + esc(info.apiEndpoint) + '</span>'
      html += '</div>'
    }

    if (info.agentInfo) {
      html += '<div class="hover-tooltip-section"><div class="hover-tooltip-label">Agent Context</div>'
      html += '<div class="hover-tooltip-value">ID: ' + esc(info.agentInfo.id) + '</div>'
      if (info.agentInfo.name) {
        html += '<div class="hover-tooltip-value">Name: ' + esc(info.agentInfo.name) + '</div>'
      }
      html += '</div>'
    }

    return html
  }

  // Global hover listener for tooltip
  document.addEventListener("mousemove", (e) => {
    if (!tooltipEnabled || state.selectingElement) {
      hideTooltip()
      return
    }

    const info = analyzeElement(e.target)
    if (info && (info.alpine || info.apiEndpoint || info.agentInfo || Object.keys(info.dataAttrs).length > 0)) {
      showTooltip(e.clientX, e.clientY, buildTooltipContent(info))
    } else {
      hideTooltip()
    }
  }, { passive: true })

  document.addEventListener("mouseleave", hideTooltip, { passive: true })

  // ─── Keyboard Shortcuts ─────────────────────────────────────────
  const SHORTcutsHelp = document.createElement("div")
  shortcutsHelp.className = "shortcuts-help"
  shortcutsHelp.innerHTML = `
    <div class="divider"></div>
    <div class="shortcut-item"><span class="shortcut-key">Ctrl+Shift+N</span> New Note</div></div>
    <div class="shortcut-item"><span class="shortcut-key">Ctrl+shift+s</span> Screenshot</div></div>
    <div class="shortcut-item"><span class="shortcut-key">Ctrl+shift+e</span> Element Select</div></div>
    <div class="shortcut-item"><span class="shortcut-key">Ctrl+shift+f</span> Search</div></div>
    <div class="shortcut-item"><span class="shortcut-key">Ctrl+shift+h</span> Toggle tooltips</div></div>
    <div class="shortcut-item"><span class="shortcut-key">Esc</span> Cancel</div></div>
  `
  body.appendChild(shortcutsHelp)

  // ─── FAB ───────────────────────────────────────────────────
  const fab = document.createElement("button");
  fab.className = "fab";
  fab.textContent = "D"
  fab.title = "DevScribe"
  root.appendChild(fab);

  // ─── Panel ─────────────────────────────────────────────────
  const panel = document.createElement("div");
  panel.className = "panel collapsed"
  root.appendChild(panel)

  // Handle
  const handleEl = document.createElement("div")
  handle.className = "handle"
  handle.innerHTML = '<span class="handle-title">DEVScribe</span><div class="handle-btns"><button class="handle-btn" id="ds-minimize" title="Minimize">&#x2212;</button></div>'
  panel.appendChild(handle)

  // Tabs
  const tabs = document.createElement("div");
  tabs.className = "tabs"
  ; ["Notes", "Capture", "Search", "State"].forEach((name) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.dataset.pane = name.toLowerCase();
    b.textContent = name
    if (name === "Notes") b.classList.add("active")
    b.addEventListener("click", () => switchTab(name.toLowerCase()))
    tabs.appendChild(b)
  })
  panel.appendChild(tabs)

  // Body
  const body = document.createElement("div");
  body.className = "body"
  panel.appendChild(body)

  // ─── Notes Pane ────────────────────────────────────────────────
  const notesPane = document.createElement("div");
  notesPane.className = "pane active"
  notesPane.dataset.pane = "notes"
  notesPane.innerHTML =
    '<div class="note-form">' +
      '<label>Title</label>' +
      '<input type="text" id="ds-note-title" placeholder="Brief description..." />' +
      '<label>Body</label>' +
      '<textarea id="ds-note-body" placeholder="Details..."></textarea>' +
      '<label>Type</label>' +
      '<select id="ds-note-type">' +
        '<option value="observation">Observation</option>' +
        '<option value="bug">Bug</option>' +
        '<option value="feature">Feature</option>' +
        '<option value="debt">Debt</option>' +
        '<option value="performance">Performance</option>' +
      '</select>' +
      '<label>Tags (comma-separated)</label>' +
      '<input type="text" id="ds-note-tags" placeholder="ui, api, auth..." />' +
      '<div class="btn-row"><button class="btn btn-primary" id="ds-save-note">Save Note</button></div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div id="ds-notes-list"></div>'
  body.appendChild(notesPane)

  // ─── Capture Pane ──────────────────────────────────────────────
  const capturePane = document.createElement("div");
  capturePane.className = "pane"
  capturePane.dataset.pane = "capture"
  capturePane.innerHTML =
    '<div class="capture-grid">' +
      '<button class="btn btn-ghost" data-action="screenshot">&#128247; Screenshot</button>' +
      '<button class="btn btn-ghost" data-action="element">&#128269; Capture Element</button>' +
      '<button class="btn btn-ghost" data-action="state">&#128196; Capture State</button>' +
      '<button class="btn btn-ghost" data-action="console">&#128220; Capture Console</button>' +
      '<button class="btn btn-ghost" data-action="network">&#128268; Capture Network</button>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div id="ds-capture-preview" class="scroll-list"></div>'
  body.appendChild(capturePane)

  // ─── Search Pane ────────────────────────────────────────────────
  const searchPane = document.createElement("div");
  searchPane.className = "pane"
  searchPane.dataset.pane = "search"
  searchPane.innerHTML =
    '<div class="search-input-wrap">' +
      '<input type="text" id="ds-search-input" placeholder="Search notes, logs, requests..." />' +
      '<button class="search-clear" id="ds-search-clear">&times;</button>' +
    '</div>' +
    '<div class="search-filters">' +
      '<button class="search-filter active" data-filter="all">All</button>' +
      '<button class="search-filter" data-filter="notes">Notes</button>' +
      '<button class="search-filter" data-filter="console">Console</button>' +
      '<button class="search-filter" data-filter="network">Network</button>' +
    '</div>' +
    '<div class="search-filters">' +
      '<button class="search-filter active" data-date="all">All Time</button>' +
      '<button class="search-filter" data-date="today">Today</button>' +
      '<button class="search-filter" data-date="week">This Week</button>' +
    '</div>' +
    '<div class="search-result-count" id="ds-search-count" style="display:none"></div>' +
    '<div id="ds-search-results" class="scroll-list"></div>' +
    '<div class="search-history" id="ds-search-history">' +
      '<div class="search-history-title">Recent Searches</div>' +
    '</div>'
  body.appendChild(searchPane)

  // ─── State Pane ────────────────────────────────────────────────
  const statePane = document.createElement("div");
  statePane.className = "pane"
  statePane.dataset.pane = "state"
  statePane.innerHTML =
    '<div id="ds-state-info"></div>' +
    '<div class="divider"></div>' +
    '<label>Developer Mode</label>' +
    '<div class="btn-row">' +
      '<button class="btn btn-ghost" id="ds-dev-toggle">Toggle DevMode</button>' +
      '<button class="btn btn-ghost" id="ds-state-refresh">Refresh</button>' +
    '</div>'
  body.appendChild(statePane)

  // ─── Selector Inline Form ──────────────────────────────────────────────
  const selectorForm = document.createElement("div");
  selectorForm.style.cssText = "display:none"
  selectorForm.innerHTML =
    '<div class="divider"></div>' +
    '<label>Captured Element</label>' +
    '<input type="text" id="ds-el-title" placeholder="Note title..." />' +
    '<textarea id="ds-el-body" rows="3" placeholder="Notes about this element..."></textarea>' +
    '<div class="btn-row">' +
      '<button class="btn btn-primary btn-sm" id="ds-el-save">Save Note</button>' +
      '<button class="btn btn-ghost btn-sm" id="ds-el-cancel">Cancel</button>' +
    '</div>'
  capturePane.appendChild(selectorForm)

  // ─── Tab Switching ─────────────────────────────────────────────────
  function switchTab(name) {
    panel.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.pane === name))
    panel.querySelectorAll(".pane").forEach((p) => p.classList.toggle("active", p.dataset.pane === name))
    if (name === "state") refreshState()
    if (name === "notes") renderNotes()
    if (name === "search") initSearchPane()
  }

  function expandPanel() {
    panel.classList.remove("collapsed")
    fab.style.display = "none"
  }

  function collapsePanel() {
    panel.classList.add("collapsed")
    fab.style.display = "block"
  }

  // ─── Collapse / Expand ─────────────────────────────────────────────────
  fab.addEventListener("click", expandPanel)
  handle.querySelector("#ds-minimize").addEventListener("click", collapsePanel)

  // ─── Dragging ──────────────────────────────────────────────────
  let dragOffsetX = 0, dragOffsetY = 0, dragging = false
  handle.addEventListener("mousedown", (e) => {
    dragging = true
    const rect = panel.getBoundingClientRect()
    dragOffsetX = e.clientX - rect.left
    dragOffsetY = e.clientY - rect.top
    e.preventDefault()
  })
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return
    host.style.right = "auto"
    host.style.bottom = "auto"
    host.style.left = (e.clientX - dragOffsetX) + "px"
    host.style.top = (e.clientY - dragOffsetY) + "px"
  })
  document.addEventListener("mouseup", () => { dragging = false })

  // ─── Notes CRUD ──────────────────────────────────────────────────
  async function loadNotes() {
    const resp = await sendToBackground("GET_NOTES")
    if (resp && resp.success && resp.data) state.notes = resp.data
    renderNotes()
  }

  function renderNotes() {
    const list = panel.querySelector("#ds-notes-list")
    if (!state.notes.length) {
      list.innerHTML = '<div class="empty">No notes yet</div>'
      return
    }
    list.innerHTML = state.notes.map((n, i) =>
      '<div class="note-card">' +
        '<div class="note-card-header">' +
          '<span class="note-title">' + esc(n.title) + '</span>' +
          '<span class="badge badge-' + esc(n.type) + '">' + esc(n.type) + '</span>' +
        '</div>' +
        '<div class="note-meta">' +
          '<span>' + fmtTime(n.ts || n.created_at) + '</span>' +
          (n.page ? '<span>' + esc(n.page) + '</span>' : '') +
          (n.tags && n.tags.length ? '<span>' + n.tags.map(esc).join(", ") + '</span>' : '') +
        '</div>' +
        (n.body ? '<div class="note-body">' + esc(n.body) + '</div>' : '') +
        '<div class="note-actions">' +
          '<button class="btn btn-ghost btn-sm" data-gh="' + n.id + '" title="Create GitHub Issue">&#9881; Issue</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + n.id + '">&#10005;</button>' +
        '</div>' +
      '</div>'
    ).join("")

    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        sendToBackground("DELETE_NOTE", { id: b.dataset.del }).then(loadNotes)
      })
    )
    list.querySelectorAll("[data-gh]").forEach((b) =>
      b.addEventListener("click", () => {
        const note = state.notes.find((n) => n.id === b.dataset.gh)
        if (note) sendToBackground("CREATE_GITHUB_ISSUE", { note })
      })
    )
  }

  panel.querySelector("#ds-save-note").addEventListener("click", async () => {
    const title = panel.querySelector("#ds-note-title").value.trim()
    if (!title) return
    const note = {
      id: "n_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      title,
      body: panel.querySelector("#ds-note-body").value.trim(),
      type: panel.querySelector("#ds-note-type").value,
      tags: panel.querySelector("#ds-note-tags").value.split(",").map((t) => t.trim()).filter(Boolean),
      page: window.location.hash || "#/",
      ts: Date.now(),
    }
    await sendToBackground("SAVE_NOTE", { note })
    panel.querySelector("#ds-note-title").value = ""
    panel.querySelector("#ds-note-body").value = ""
    panel.querySelector("#ds-note-tags").value = ""
    loadNotes()
  })

  // ─── Capture Actions ───────────────────────────────────────────────────
  capturePane.querySelectorAll("[data-action]").forEach((btn) =>
    btn.addEventListener("click", () => handleCaptureAction(btn.dataset.action))
  )

  function handleCaptureAction(action) {
    switch (action) {
      case "screenshot":
        sendToBackground("CAPTURE_SCREENSHOT").then((resp) => {
          if (resp && resp.success && resp.data) {
            showCapturePreview("<img src='" + resp.data + "' style='max-width:100%;border-radius:4px;margin-top:6px'/>")
            promptNoteFromCapture("Screenshot", "Screenshot captured at " + fmtTime(Date.now()), "observation")
          }
        })
        break
      case "element":
        startElementSelection()
        break
      case "state": {
        const st = getAppState()
        const json = JSON.stringify(st.alpine, null, 2)
        showCapturePreview("<pre style='white-space:pre-wrap;color:#ffd700;font-size:11px;font-family:\"IBM Plex Mono\",monospace;text-shadow:0 0 4px rgba(255,215,0,0.3)'>" + esc(json) + "</pre>")
        promptNoteFromCapture("State Snapshot", json, "observation")
        break
      }
      case "console": {
        const logs = consoleBuffer.slice(-30)
        const html = logs.map((l) =>
          "<div class='log-entry'><span class='lvl-" + l.level + "'>[" + l.level.toUpperCase() + "]</span> " +
          l.args.map(esc).join(" ") + "</div>"
        ).join("")
        showCapturePreview(html || '<div class="empty">No console output</div>')
        if (logs.length) {
          promptNoteFromCapture(
            "Console Capture",
            logs.map((l) => "[" + l.level + "] " + l.args.join(" ")).join("\n"),
            "observation"
          )
        }
        break
      }
      case "network": {
        const reqs = networkBuffer.slice(-20)
        const html = reqs.map((r) =>
          "<div class='log-entry'><span style='color:#ffd700;text-shadow:0 0 4px rgba(255,215,0,0.3)'>" + esc(r.method) + "</span> " +
          "<span class='lvl-" + (r.status >= 400 ? "error" : "log") + "'>" + r.status + "</span> " +
          esc(r.url) + " <span style='color:#666'>" + Math.round(r.ms) + "ms</span></div>"
        ).join("")
        showCapturePreview(html || '<div class="empty">No API requests captured</div>')
        break
      }
    }
  }

  function showCapturePreview(html) {
    capturePane.querySelector("#ds-capture-preview").innerHTML = html
  }

  function promptNoteFromCapture(title, body, type) {
    panel.querySelector("#ds-note-title").value = title
    panel.querySelector("#ds-note-body").value = body
    panel.querySelector("#ds-note-type").value = type || "observation"
    switchTab("notes")
  }

  // ─── Element Selection Mode ────────────────────────────────────────────
  let hoverMoveHandler = null
  let hoverClickHandler = null
  let hoverKeyHandler = null

  function startElementSelection() {
    state.selectingElement = true
    overlay.style.display = "block"
    document.body.style.cursor = "crosshair"

    hoverMoveHandler = (e) => {
      if (!state.selectingElement) return
      const el = e.target
      if (host.contains(el)) return
      const rect = el.getBoundingClientRect()
      overlay.style.left = rect.left + "px"
      overlay.style.top = rect.top + "px"
      overlay.style.width = rect.width + "px"
      overlay.style.height = rect.height + "px"
    }

    hoverClickHandler = (e) => {
      if (!state.selectingElement) return
      if (host.contains(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      finishSelection(e.target)
    }

    hoverKeyHandler = (e) => {
      if (e.key === "Escape") {
        finishSelection(null)
      }
    }

    document.addEventListener("mousemove", hoverMoveHandler, true)
    document.addEventListener("click", hoverClickHandler, true)
    document.addEventListener("keydown", hoverKeyHandler, true)
  }

  function finishSelection(el) {
    state.selectingElement = false
    overlay.style.display = "none"
    document.body.style.cursor = ""
    if (hoverMoveHandler) document.removeEventListener("mousemove", hoverMoveHandler, true)
    if (hoverClickHandler) document.removeEventListener("click", hoverClickHandler, true)
    if (hoverKeyHandler) document.removeEventListener("keydown", hoverKeyHandler, true)
    hoverMoveHandler = null
    hoverClickHandler = null
    hoverKeyHandler = null

    if (!el) return

    const dataAttrs = {}
    for (const attr of el.attributes || []) {
      if (attr.name.startsWith("data-")) dataAttrs[attr.name] = attr.value
    }

    const captured = {
      selector: buildSelector(el),
      text: (el.textContent || "").slice(0, 200),
      rect: el.getBoundingClientRect().toJSON(),
      dataAttributes: dataAttrs,
      ariaLabel: el.getAttribute("aria-label") || null,
      tagName: el.tagName,
    }

    showCapturePreview(
      "<pre style='white-space:pre-wrap;color:#ffd700;font-size:11px;max-height:120px;overflow:auto;font-family:\"IBM Plex Mono\",monospace;text-shadow:0 0 4px rgba(255,215,0,0.3)'>" +
      esc(JSON.stringify(captured, null, 2)) + "</pre>"
    )

    selectorForm.style.display = "block"
    const elTitle = selectorForm.querySelector("#ds-el-title")
    const elBody = selectorForm.querySelector("#ds-el-body")
    elTitle.value = el.tagName + (el.id ? "#" + el.id : "") + " element"
    elBody.value = captured.text

    selectorForm.querySelector("#ds-el-save").onclick = () => {
      const note = {
        id: "n_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        title: elTitle.value.trim() || "Element capture",
        body: elBody.value.trim() + "\n\n---\nSelector: " + captured.selector + "\nRect: " + JSON.stringify(captured.rect),
        type: "observation",
        tags: ["element"],
        page: window.location.hash || "#/",
        ts: Date.now(),
      }
      sendToBackground("SAVE_NOTE", { note }).then(loadNotes)
      selectorForm.style.display = "none"
      switchTab("notes")
    }

    selectorForm.querySelector("#ds-el-cancel").onclick = () => {
      selectorForm.style.display = "none"
    }
  }

  function buildSelector(el) {
    if (el.id) return "#" + el.id
    const parts = []
    let cur = el
    while (cur && cur !== document.body && cur !== document.documentElement) {
      let sel = cur.tagName.toLowerCase()
      if (cur.id) { parts.unshift("#" + cur.id); break }
      if (cur.className && typeof cur.className === "string") {
        const cls = cur.className.trim().split(/\s+/).filter((c) => c && !c.startsWith("ds-")).join(".")
        if (cls) sel += "." + cls
      }
      const parent = cur.parentElement
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === cur.tagName)
        if (siblings.length > 1) sel += ":nth-of-type(" + (siblings.indexOf(cur) + 1) + ")"
      }
      parts.unshift(sel)
      cur = cur.parentElement
    }
    return parts.join(" > ")
  }

  // ─── State Pane ────────────────────────────────────────────────
  function refreshState() {
    const s = getAppState()
    const info = panel.querySelector("#ds-state-info")
    const rows = [
      ["URL", s.url],
      ["Hash", s.hash],
      ["API Available", s.apiAvailable ? "Yes" : "No"],
    ]
    if (s.alpine) {
      rows.push(["Page", s.alpine.page || "\u2014"])
      rows.push(["Agents", String(s.alpine.agentsCount ?? "\u2014")])
      rows.push(["Connected", s.alpine.connected ? "Yes" : "No"])
      rows.push(["DevMode", s.alpine.devMode ? "On" : "Off"])
      if (s.alpine.version) rows.push(["Version", s.alpine.version])
    }
    info.innerHTML = rows.map(([k, v]) =>
      "<div class='kv'><span class='kv-key'>" + esc(k) + "</span><span class='kv-val'>" + esc(v) + "</span></div>"
    ).join("")
  }

  panel.querySelector("#ds-dev-toggle").addEventListener("click", () => {
    try {
      if (window.Alpine) {
        const s = Alpine.store("app")
        if (s) s.devMode = !s.devMode
      }
    } catch {}
    refreshState()
  })
  panel.querySelector("#ds-state-refresh").addEventListener("click", refreshState)

  // ─── Search Pane ────────────────────────────────────────────────
  let searchDebounce = null

  function initSearchPane() {
    renderSearchHistory()
  }

  function performSearch(query) {
    const resultsContainer = panel.querySelector("#ds-search-results")
    const countEl = panel.querySelector("#ds-search-count")

    if (!query || query.length < 2) {
      resultsContainer.innerHTML = ""
      countEl.style.display = "none"
      renderSearchHistory()
      return
    }

    query = query.toLowerCase().trim()

    // Save to search history
    if (!state.searchHistory.includes(query)) {
      state.searchHistory = [query, ...state.searchHistory].slice(0, 10)
      sendToBackground("SAVE_SETTINGS", { search_history: state.searchHistory })
      renderSearchHistory()
    }

    // Get active filters
    const typeFilter = panel.querySelector(".search-filter[data-filter].active")?.dataset.filter || "all"
    const dateFilter = panel.querySelector(".search-filter[data-date].active")?.dataset.date || "all"

    const results = []

    // Date range calculation
    const now = Date.now()
    let minTs = 0
    if (dateFilter === "today") {
      minTs = new Date().setHours(0, 0, 0, 0)
    } else if (dateFilter === "week") {
      minTs = now - 7 * 24 * 60 * 60 * 1000
    }

    // Search notes
    if (["all", "notes"].includes(typeFilter)) {
      state.notes.forEach(n => {
        const ts = new Date(n.created_at || n.ts).getTime()
        if (ts < minTs) return
        const text = (n.title + " " + (n.body || "") + " " + (n.tags || []).join(" ")).toLowerCase()
        if (text.includes(query)) {
          results.push({ type: "note", data: n, ts })
        }
      })
    }

    // Search console
    if (["all", "console"].includes(typeFilter)) {
      consoleBuffer.forEach(l => {
        if (l.ts < minTs) return
        const text = l.args.join(" ").toLowerCase()
        if (text.includes(query)) {
          results.push({ type: "console", data: l, ts: l.ts })
        }
      })
    }

    // Search network
    if (["all", "network"].includes(typeFilter)) {
      networkBuffer.forEach(r => {
        if (r.ts < minTs) return
        const text = (r.url + " " + r.method + " " + String(r.status)).toLowerCase()
        if (text.includes(query)) {
          results.push({ type: "network", data: r, ts: r.ts })
        }
      })
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.ts - a.ts)

    // Update count
    countEl.textContent = results.length + " result" + (results.length !== 1 ? "s" : "")
    countEl.style.display = "block"

    // Render results
    if (!results.length) {
      resultsContainer.innerHTML = '<div class="empty">No results found</div>'
      return
    }

    resultsContainer.innerHTML = results.slice(0, 50).map(r => {
      const icon = r.type === "note" ? "&#128221;" : r.type === "console" ? "&#128187;" : "&#127760;"
      const badgeClass = r.type === "note" ? "badge-" + (r.data.type || "observation") : ""
      const title = r.type === "note"
        ? esc(r.data.title)
        : r.type === "console"
        ? "[" + r.data.level + "] " + esc(r.data.args[0]?.slice(0, 50) || "")
        : esc(r.data.method) + " " + esc(r.data.url)

      return '<div class="note-card" style="cursor:pointer">' +
        '<div class="note-card-header">' +
          '<span>' + icon + '</span>' +
          '<span class="note-title" style="flex:1">' + title + '</span>' +
          (badgeClass ? '<span class="badge ' + badgeClass + '">' + esc(r.data.type || r.type) + '</span>' : '') +
        '</div>' +
        '<div class="note-meta">' + fmtTime(r.ts) + '</div>' +
      '</div>'
    }).join("")
  }

  function renderSearchHistory() {
    const historyContainer = panel.querySelector("#ds-search-history")
    const history = state.searchHistory || []

    // Keep the title
    historyContainer.innerHTML = '<div class="search-history-title">Recent Searches</div>'

    if (!history.length) {
      historyContainer.innerHTML += '<div class="empty">No recent searches</div>'
      return
    }

    history.slice(0, 5).forEach((q) => {
      const item = document.createElement("div")
      item.className = "search-history-item"
      item.textContent = q
      item.addEventListener("click", () => {
        state.searchQuery = q
        panel.querySelector("#ds-search-input").value = q
        performSearch(q)
      })
      historyContainer.appendChild(item)
    })
  }

  // Search input handler
  searchPane.querySelector("#ds-search-input").addEventListener("input", (e) => {
    state.searchQuery = e.target.value
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      performSearch(state.searchQuery)
    }, 200)
  })

  // Clear button
  searchPane.querySelector("#ds-search-clear").addEventListener("click", () => {
    state.searchQuery = ""
    panel.querySelector("#ds-search-input").value = ""
    panel.querySelector("#ds-search-results").innerHTML = ""
    panel.querySelector("#ds-search-count").style.display = "none"
    renderSearchHistory()
  })

  // Filter buttons - type
  searchPane.querySelectorAll(".search-filter[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter
      searchPane.querySelectorAll(".search-filter[data-filter]").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === filter)
      })
      performSearch(state.searchQuery)
    })
  })

  // Filter buttons - date
  searchPane.querySelectorAll(".search-filter[data-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dateFilter = btn.dataset.date
      searchPane.querySelectorAll(".search-filter[data-date]").forEach((b) => {
        b.classList.toggle("active", b.dataset.date === dateFilter)
      })
      performSearch(state.searchQuery)
    })
  })

  // Load search history from settings
  sendToBackground("GET_SETTINGS").then((resp) => {
    if (resp?.success && resp.data?.search_history) {
      state.searchHistory = resp.data.search_history
    }
  })

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────
  const SHORTCUTS = {
    "ctrl+shift+n": { action: "new-note", label: "New Note" },
    "ctrl+shift+s": { action: "screenshot", label: "Screenshot" },
    "ctrl+shift+e": { action: "element-select", label: "Element Select" },
    "ctrl+shift+f": { action: "search", label: "Search" },
    "ctrl+shift+h": { action: "toggle-tooltip", label: "Toggle Tooltip" },
    "escape": { action: "cancel", label: "Cancel/Close" },
  }

  function handleShortcut(e) {
    const key = []
    if (e.ctrlKey || e.metaKey) key.push("ctrl")
    if (e.shiftKey) key.push("shift")
    if (e.altKey) key.push("alt")
    key.push(e.key.toLowerCase())
    const combo = key.join("+")

    const shortcut = SHORTCUTS[combo]
    if (!shortcut) return

    e.preventDefault()
    e.stopPropagation()

    switch (shortcut.action) {
      case "new-note":
        expandPanel()
        switchTab("notes")
        panel.querySelector("#ds-note-title").focus()
        break
      case "screenshot":
        expandPanel()
        switchTab("capture")
        handleCaptureAction("screenshot")
        break
      case "element-select":
        expandPanel()
        switchTab("capture")
        if (state.selectingElement) {
          finishSelection(null)
        } else {
          startElementSelection()
        }
        break
      case "search":
        expandPanel()
        switchTab("search")
        panel.querySelector("#ds-search-input")?.focus()
        break
      case "toggle-tooltip":
        tooltipEnabled = !tooltipEnabled
        sendToBackground("SAVE_SETTINGS", { tooltip_enabled: tooltipEnabled })
        showToast("Tooltip " + (tooltipEnabled ? "enabled" : "disabled"))
        break
      case "cancel":
        if (state.selectingElement) {
          finishSelection(null)
        } else if (!panel.classList.contains("collapsed")) {
          collapsePanel()
        }
        break
    }
  }

  document.addEventListener("keydown", handleShortcut, true)

  // Toast notification helper
  function showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = "ds-toast ds-toast-" + type
    toast.textContent = message
    toast.style.cssText = `
      position:fixed;bottom:60px;right:60px;z-index:999999;
      padding:10px 16px;border-radius:10px;font-size:12px;font-family:'Manrope',sans-serif;
      background:linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%), #141824;
      border:1px solid rgba(255,215,0,0.25);color:#e0e0f0;
      box-shadow:0 8px 24px rgba(0,0,0,0.5);
      animation:fadeIn 0.2s;
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transition = "opacity 0.3s"
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }

  // ─── Hash Watch ──────────────────────────────────────────────────
  window.addEventListener("hashchange", () => {
    if (panel.querySelector(".pane[data-pane='state']").classList.contains("active")) {
      refreshState()
    }
  })

  // ─── Utilities ─────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return ""
    const d = document.createElement("div")
    d.textContent = String(s)
    return d.innerHTML
  }

  function fmtTime(ts) {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  // ─── Init ──────────────────────────────────────────────────────
  loadNotes()
  initSearchPane()
  origConsole.log("[DevScribe] Content script loaded - Phase 2 features active")
})()
