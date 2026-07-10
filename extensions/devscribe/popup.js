const DASHBOARD_URL = "http://127.0.0.1:4332";

const $ = (id) => document.getElementById(id);

async function getDashboardTab() {
  const tabs = await chrome.tabs.query({ url: `${DASHBOARD_URL}/*` });
  return tabs[0] || null;
}

function setConnected(connected) {
  const dot = $("statusDot");
  const text = $("statusText");
  dot.className = `status-dot ${connected ? "connected" : "disconnected"}`;
  text.textContent = connected ? "Dashboard connected" : "Dashboard not open";
}

function setNoteCount(n) {
  $("noteCount").textContent = n;
}

async function loadNoteCount() {
  const res = await chrome.runtime.sendMessage({ type: "GET_NOTES" });
  if (res?.success) setNoteCount(res.data.length);
}

async function sendMessageToTab(tabId, msg) {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    return null;
  }
}

async function init() {
  const tab = await getDashboardTab();
  setConnected(!!tab);
  console.log("Popup init, dashboard tab:", tab);

  await loadNoteCount();

   $("btnNewNote").addEventListener("click", async () => {
     console.log("New Note clicked");
     if (!tab) { console.log("No dashboard tab found"); return; }
     console.log("Sending OPEN_PANEL to tab", tab.id);
     await sendMessageToTab(tab.id, { type: "OPEN_PANEL" });
     window.close();
   });

   $("btnElementSelect").addEventListener("click", async () => {
     console.log("Element Select clicked");
     if (!tab) { console.log("No dashboard tab found"); return; }
     console.log("Sending TOGGLE_ELEMENT_SELECT to tab", tab.id);
     await sendMessageToTab(tab.id, { type: "TOGGLE_ELEMENT_SELECT" });
     window.close();
   });

   $("btnExport").addEventListener("click", async () => {
     console.log("Export clicked");
     const res = await chrome.runtime.sendMessage({ type: "GET_NOTES" });
     console.log("GET_NOTES response:", res);
     if (!res?.success || res.data.length === 0) { console.log("No notes to export"); return; }
     const blob = new Blob([JSON.stringify(res.data, null, 2)], {
       type: "application/json",
     });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `devscribe-notes-${new Date().toISOString().slice(0, 10)}.json`;
     a.click();
     URL.revokeObjectURL(url);
     console.log("Export completed");
   });

  $("optionsLink").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage?.();
  });
}

init();
