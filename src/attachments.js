// Shared file-attachment handling for chat UIs (Assistant + per-agent chat).
// Files are read client-side to base64 and sent inline with the message —
// no storage bucket, they only need to exist for that one Gemini call.

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB raw per file
export const MAX_FILES = 3;
export const MAX_TOTAL_BYTES = 3 * 1024 * 1024; // 3MB combined raw per message

// Reads a File into { mimeType, data (base64, no data: prefix), name, size }.
// Throws a short, user-facing message string on anything invalid.
export function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(`${file.name}: only images (PNG/JPEG/WebP) and PDFs are supported.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      reject(`${file.name}: too large (max 3MB per file).`);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(`${file.name}: couldn't read that file.`);
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.slice(result.indexOf(",") + 1);
      resolve({ mimeType: file.type, data: base64, name: file.name, size: file.size });
    };
    reader.readAsDataURL(file);
  });
}

// Validates a proposed set of attachments (existing + new) against the
// combined-size and file-count caps. Returns an error string, or null if ok.
export function validateAttachmentSet(attachments) {
  if (attachments.length > MAX_FILES) return `Up to ${MAX_FILES} files per message.`;
  const total = attachments.reduce((s, a) => s + (a.size || 0), 0);
  if (total > MAX_TOTAL_BYTES) return "Attachments too large — 3MB combined max.";
  return null;
}

export function isImage(mimeType) {
  return mimeType && mimeType.startsWith("image/");
}
