// VCard 3.0 export — hand-rolled, no dependency. Concatenates one BEGIN:VCARD
// block per contact into a single .vcf file. Adds a NOTE with WhatsApp
// metadata (chat type, last activity, source).

function escapeVCardValue(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function vcardBlock({ fn, tel, note }) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (fn) lines.push(`FN:${escapeVCardValue(fn)}`);
  if (tel) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(tel)}`);
  if (note) lines.push(`NOTE:${escapeVCardValue(note)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function chatsToVcard(chats, { includeUnsaved = false } = {}) {
  const blocks = [];
  for (const c of chats) {
    if (c.isGroup) continue; // groups not exported as vCard
    if (!includeUnsaved && !c.isMyContact && !c.contactName) continue;
    const fn = c.contactName || c.formattedName || c.verifiedName || c.name || c.formattedTitle || c.pushName || c.phone || "";
    if (!fn && !c.phone) continue;
    const lastTs = c.lastMessage?.t || c.t;
    const note = `WhatsApp 1-on-1 · is_my_contact=${c.isMyContact ? "true" : "false"}` +
      (lastTs ? ` · last_msg=${new Date(lastTs * 1000).toISOString()}` : "");
    blocks.push(vcardBlock({ fn, tel: c.phone, note }));
  }
  return blocks.join("\r\n") + "\r\n";
}

export function contactsToVcard(contacts, { includeUnsaved = false } = {}) {
  const blocks = [];
  for (const c of contacts) {
    if (!c.isUser) continue;
    if (!includeUnsaved && !c.isMyContact) continue;
    const fn = c.name || c.formattedName || c.verifiedName || c.pushName || c.phone || "";
    if (!fn && !c.phone) continue;
    const note = `WhatsApp Contact · is_my_contact=${c.isMyContact ? "true" : "false"}` +
      (c.isBusiness ? " · business=true" : "");
    blocks.push(vcardBlock({ fn, tel: c.phone, note }));
  }
  return blocks.join("\r\n") + "\r\n";
}

export function groupMembersToVcard(groups, { includeUnsaved = false } = {}) {
  const blocks = [];
  const seen = new Set();
  for (const g of groups) {
    const groupName = g.formattedTitle || g.name || "";
    for (const p of g.participants || []) {
      if (!p.phone) continue;
      if (seen.has(p.phone)) continue;
      seen.add(p.phone);
      if (!includeUnsaved && !p.name) continue;
      const fn = p.name || p.phone;
      const note = `WhatsApp Group Member · group=${groupName}` +
        (p.isSuperAdmin ? " · superadmin=true" : (p.isAdmin ? " · admin=true" : ""));
      blocks.push(vcardBlock({ fn, tel: p.phone, note }));
    }
  }
  return blocks.join("\r\n") + "\r\n";
}

export function vcardBlob(text) {
  return new Blob([text], { type: "text/vcard;charset=utf-8" });
}
