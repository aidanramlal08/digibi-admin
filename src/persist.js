// Lightweight localStorage persistence for chat history. Wrapped in
// try/catch since localStorage can throw (private browsing, quota,
// disabled) — persistence is a nice-to-have, never load-bearing.

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or unavailable — persistence just skips this write
  }
}

// Attachment binary (base64) is never persisted — only the fact that a
// file was sent (name + type) — so a long conversation with a few images
// doesn't blow the ~5-10MB localStorage quota in one save. After a reload,
// older attachments show their chip but aren't resent to Gemini as
// context; only the text history carries forward.
export function stripAttachmentBytes(messages) {
  return (messages || []).map((m) =>
    m.attachments && m.attachments.length
      ? { ...m, attachments: m.attachments.map(({ name, mimeType }) => ({ name, mimeType })) }
      : m,
  );
}

// Caps how many messages are kept per persisted thread.
export const MAX_PERSISTED_MESSAGES = 60;
