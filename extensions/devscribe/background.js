const KEYS = {
  NOTES: "devscribe_notes",
  TOKEN: "devscribe_github_token",
  REPO: "devscribe_github_repo",
  SETTINGS: "devscribe_settings",
};

const DEFAULT_SETTINGS = {
  tooltip_enabled: true,
  search_history: [],
  keyboard_shortcuts: true,
};

function uuid() {
  return crypto.randomUUID();
}

async function getNotes() {
  const res = await chrome.storage.local.get(KEYS.NOTES);
  return res[KEYS.NOTES] || [];
}

async function saveNotes(notes) {
  await chrome.storage.local.set({ [KEYS.NOTES]: notes });
}

async function getGithubConfig() {
  const res = await chrome.storage.local.get([KEYS.TOKEN, KEYS.REPO]);
  return {
    token: res[KEYS.TOKEN] || "",
    repo: res[KEYS.REPO] || { owner: "", repo: "" },
  };
}

async function setGithubConfig({ token, repo }) {
  const updates = {};
  if (token !== undefined) updates[KEYS.TOKEN] = token;
  if (repo !== undefined) updates[KEYS.REPO] = repo;
  await chrome.storage.local.set(updates);
}

async function getSettings() {
  const res = await chrome.storage.local.get(KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(res[KEYS.SETTINGS] || {}) };
}

async function saveSettings(settings) {
  const current = await getSettings();
  const merged = { ...current, ...settings };
  await chrome.storage.local.set({ [KEYS.SETTINGS]: merged });
}

async function handleSaveNote(note) {
  const notes = await getNotes();
  const entry = {
    id: note.id || uuid(),
    title: note.title || "Untitled",
    body: note.body || "",
    type: note.type || "observation",
    page: note.page || "",
    screenshot: note.screenshot || null,
    element: note.element || null,
    tags: note.tags || [],
    created_at: note.created_at || new Date().toISOString(),
  };
  notes.push(entry);
  await saveNotes(notes);
  return { success: true, data: entry };
}

async function handleDeleteNote(id) {
  const notes = await getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return { success: false, error: "Note not found" };
  notes.splice(idx, 1);
  await saveNotes(notes);
  return { success: true, data: id };
}

async function handleCreateGithubIssue(noteId) {
  const { token, repo } = await getGithubConfig();
  if (!token) return { success: false, error: "GitHub token not configured" };
  if (!repo.owner || !repo.repo)
    return { success: false, error: "GitHub repo not configured" };

  const notes = await getNotes();
  const note = notes.find((n) => n.id === noteId);
  if (!note) return { success: false, error: "Note not found" };

  const labels = [note.type];
  const issueBody = `${note.body}\n\n---\n**Type:** ${note.type}\n**Page:** ${note.page}\n**Created:** ${note.created_at}\n${note.tags.length ? `**Tags:** ${note.tags.join(", ")}\n` : ""}---\n_Captured with DevScribe_`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: note.title, body: issueBody, labels }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || `GitHub API error ${res.status}`,
      };
    }
    const issue = await res.json();
    return { success: true, data: { url: issue.html_url, number: issue.number } };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function handleCaptureScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
    return { success: true, data: dataUrl };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "SAVE_NOTE":
      handleSaveNote(msg.note).then(sendResponse);
      return true;
    case "GET_NOTES":
      getNotes().then((notes) => sendResponse({ success: true, data: notes }));
      return true;
    case "DELETE_NOTE":
      handleDeleteNote(msg.id).then(sendResponse);
      return true;
    case "CREATE_GITHUB_ISSUE":
      handleCreateGithubIssue(msg.note?.id).then(sendResponse);
      return true;
    case "CAPTURE_SCREENSHOT":
      handleCaptureScreenshot().then(sendResponse);
      return true;
    case "GET_GITHUB_CONFIG":
      getGithubConfig().then((cfg) =>
        sendResponse({ success: true, data: cfg })
      );
      return true;
    case "SET_GITHUB_CONFIG":
      setGithubConfig(msg).then(() =>
        sendResponse({ success: true })
      );
      return true;
    case "GET_SETTINGS":
      getSettings().then((settings) =>
        sendResponse({ success: true, data: settings })
      );
      return true;
    case "SAVE_SETTINGS":
      saveSettings(msg.settings || msg).then(() =>
        sendResponse({ success: true })
      );
      return true;
    default:
      sendResponse({ success: false, error: `Unknown message type: ${msg.type}` });
      return false;
  }
});
