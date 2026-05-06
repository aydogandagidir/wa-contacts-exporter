// CSV export — uses PapaParse for robust quoting/escaping. UTF-8 BOM prefix
// guarantees Excel TR opens it with correct İ ş ğ ü ö ç characters.
import Papa from "papaparse";

const BOM = "﻿";

export const CHAT_COLUMNS = [
  "name",
  "phone",
  "is_group_member",
  "group_name",
  "is_admin",
  "labels",
  "is_saved_contact",
  "last_message_date",
  "last_message_body",
  "last_message_from_me",
  "lid_user",
];

function pickDisplayName(c) {
  return c.contactName || c.formattedName || c.verifiedName || c.name || c.formattedTitle || c.pushName || c.phone || "";
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// In modern WhatsApp Web, Chat.contact is lazy-loaded — `isMyContact` reads
// false for chats whose contact record hasn't been hydrated yet. So a strict
// `isMyContact` filter wrongly excludes most saved contacts.
//
// Pragmatic discriminator: a chat is "unsaved" if its display title is a raw
// phone number (only digits, +, spaces, dashes, parens). Anything else — a
// custom name, business name, push name set by the other party — is treated
// as "saved-looking" and included by default. The strict KVKK-aware filter
// only kicks raw phone numbers out unless the user opts in.
const PHONE_TITLE_RE = /^[+\d][\d\s\-().]{3,}$/;
function looksLikeRawPhoneTitle(c) {
  if (c.isGroup) return false;
  const title = (c.contactName || c.formattedName || c.verifiedName || c.name || c.formattedTitle || c.pushName || "").trim();
  if (!title) return true; // no title at all — treat as unsaved
  return PHONE_TITLE_RE.test(title);
}

function inferIsSaved(c) {
  if (c.isGroup) return null; // n/a
  if (c.isMyContact === true) return true;
  // Fallback: title is not a raw phone number → treat as saved-looking
  return !looksLikeRawPhoneTitle(c);
}

export function chatsToRows(chats, { includeUnsaved = false } = {}) {
  const rows = [];
  for (const c of chats) {
    if (!c.isGroup && !includeUnsaved && looksLikeRawPhoneTitle(c)) continue;

    const lastTs = c.lastMessage?.t || c.t;
    const savedFlag = inferIsSaved(c);
    rows.push({
      name: pickDisplayName(c),
      phone: c.phone || "",
      is_group_member: "false", // chat rows are not member rows; member rows added in Step 5
      group_name: c.isGroup ? (c.formattedTitle || c.name || "") : "",
      is_admin: "",
      labels: "",
      is_saved_contact: savedFlag === null ? "" : (savedFlag ? "true" : "false"),
      last_message_date: fmtDate(lastTs),
      last_message_body: c.lastMessage?.body || "",
      last_message_from_me: c.lastMessage ? (c.lastMessage.fromMe ? "true" : "false") : "",
    });
  }
  return rows;
}

export function rowsToCsv(rows, columns) {
  const csv = Papa.unparse(rows, { header: true, columns, quotes: true, newline: "\r\n" });
  return BOM + csv;
}

export function chatsToCsvBlob(chats, opts) {
  const rows = chatsToRows(chats, opts);
  const csv = rowsToCsv(rows, CHAT_COLUMNS);
  return { blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), rows };
}

// ---------------- Groups ------------------

export const GROUP_COLUMNS = [
  "name",
  "phone",
  "is_group_member",
  "group_name",
  "is_admin",
  "labels",
  "is_saved_contact",
  "last_message_date",
  "last_message_body",
  "last_message_from_me",
  "lid_user",
];

export function groupsToRows(groups, { includeUnsaved = false } = {}) {
  const rows = [];
  for (const g of groups) {
    const groupName = g.formattedTitle || g.name || "";
    rows.push({
      name: groupName,
      phone: "",
      is_group_member: "false",
      group_name: groupName,
      is_admin: "",
      labels: "",
      is_saved_contact: "",
      last_message_date: g.lastMessage?.t || g.t ? fmtDateTs(g.lastMessage?.t || g.t) : "",
      last_message_body: g.lastMessage?.body || "",
      last_message_from_me: g.lastMessage ? (g.lastMessage.fromMe ? "true" : "false") : "",
      lid_user: g.lidUser || "",
    });
    for (const p of g.participants || []) {
      const isPhoneOnly = !p.name && p.phone;
      if (!includeUnsaved && isPhoneOnly) continue;
      rows.push({
        name: p.name || p.phone || p.lidUser || "",
        phone: p.phone || "",
        is_group_member: "true",
        group_name: groupName,
        is_admin: p.isSuperAdmin ? "super" : (p.isAdmin ? "true" : "false"),
        labels: "",
        is_saved_contact: p.name ? "true" : "false",
        last_message_date: "",
        last_message_body: "",
        last_message_from_me: "",
        lid_user: p.lidUser || "",
      });
    }
  }
  return rows;
}

function fmtDateTs(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function groupsToCsvBlob(groups, opts) {
  const rows = groupsToRows(groups, opts);
  const csv = rowsToCsv(rows, GROUP_COLUMNS);
  return { blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), rows };
}

// ---------------- Labels ------------------

export const LABEL_COLUMNS = ["label_id", "label_name", "color", "chat_count", "chat_ids", "is_system"];

export function labelsToRows(labels, { includeSystem = false } = {}) {
  return labels
    .filter((l) => includeSystem || !l.isSystem)
    .map((l) => ({
      label_id: String(l.id ?? ""),
      label_name: l.name || "",
      color: l.hexColor || (typeof l.color === "number" ? `#${l.color.toString(16).padStart(6, "0")}` : ""),
      chat_count: String(l.count || 0),
      chat_ids: (l.chatIds || []).join(";"),
      is_system: l.isSystem ? "true" : "false",
    }));
}

export function labelsToCsvBlob(labels, opts) {
  const rows = labelsToRows(labels, opts);
  const csv = rowsToCsv(rows, LABEL_COLUMNS);
  return { blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), rows };
}

// ---------------- All Contacts ------------------

export const CONTACT_COLUMNS = [
  "name",
  "phone",
  "is_group_member",
  "group_name",
  "is_admin",
  "labels",
  "is_saved_contact",
  "last_message_date",
  "last_message_body",
  "last_message_from_me",
  "lid_user",
];

export function contactsToRows(contacts, { includeUnsaved = false } = {}) {
  const rows = [];
  for (const c of contacts) {
    if (!c.isUser) continue; // skip non-user entries (broadcast lists, etc.)
    if (!includeUnsaved && !c.isMyContact) continue;
    const display = c.name || c.formattedName || c.verifiedName || c.pushName || c.phone || "";
    rows.push({
      name: display,
      phone: c.phone || "",
      is_group_member: "false",
      group_name: "",
      is_admin: "",
      labels: "",
      is_saved_contact: c.isMyContact ? "true" : "false",
      last_message_date: "",
      last_message_body: "",
      last_message_from_me: "",
      lid_user: c.lidUser || "",
    });
  }
  return rows;
}

export function contactsToCsvBlob(contacts, opts) {
  const rows = contactsToRows(contacts, opts);
  const csv = rowsToCsv(rows, CONTACT_COLUMNS);
  return { blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), rows };
}

// ---------------- Messages ------------------

export const MESSAGE_COLUMNS = [
  "chat_name",
  "chat_id",
  "from_me",
  "sender_name",
  "sender_phone",
  "type",
  "body",
  "timestamp",
  "is_forwarded",
  "has_media",
];

export function messagesToRows(messages) {
  return messages.map((m) => ({
    chat_name: m.chat_name || "",
    chat_id: m.chat_id || "",
    from_me: m.from_me ? "true" : "false",
    sender_name: m.sender_name || (m.from_me ? "(siz)" : ""),
    sender_phone: m.sender_phone || "",
    type: m.type || "",
    body: m.body || "",
    timestamp: fmtDateTs(m.t),
    is_forwarded: m.is_forwarded ? "true" : "false",
    has_media: m.has_media ? "true" : "false",
  }));
}

export function messagesToCsvBlob(messages) {
  const rows = messagesToRows(messages);
  const csv = rowsToCsv(rows, MESSAGE_COLUMNS);
  return { blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), rows };
}
