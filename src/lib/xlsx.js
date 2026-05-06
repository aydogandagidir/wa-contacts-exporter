// XLSX export — uses SheetJS (xlsx). Imported via dynamic import() so it
// gets code-split into a separate chunk and only fetched when the user
// actually clicks "XLSX indir". Keeps the popup's initial JS bundle small.
//
// Multi-sheet workbook layout:
//   - Sohbetler  (chats rows)
//   - Gruplar    (group + member rows)
//   - Etiketler  (labels)
//   - Kişiler    (contacts)
// Header row is bold; top row is frozen on every sheet.

import {
  CHAT_COLUMNS, chatsToRows,
  GROUP_COLUMNS, groupsToRows,
  LABEL_COLUMNS, labelsToRows,
  CONTACT_COLUMNS, contactsToRows,
  MESSAGE_COLUMNS, messagesToRows,
} from "./csv.js";

const SHEET_DEFS = [
  { name: "Sohbetler", columns: CHAT_COLUMNS, key: "chats" },
  { name: "Gruplar", columns: GROUP_COLUMNS, key: "groups" },
  { name: "Etiketler", columns: LABEL_COLUMNS, key: "labels" },
  { name: "Kişiler", columns: CONTACT_COLUMNS, key: "contacts" },
  { name: "Mesajlar", columns: MESSAGE_COLUMNS, key: "messages" },
];

function rowsForKey(key, datasets, opts) {
  const { chats, groups, labels, contacts, messages } = datasets;
  switch (key) {
    case "chats":    return chats    ? chatsToRows(chats, opts)       : [];
    case "groups":   return groups   ? groupsToRows(groups, opts)     : [];
    case "labels":   return labels   ? labelsToRows(labels)            : [];
    case "contacts": return contacts ? contactsToRows(contacts, opts) : [];
    case "messages": return messages ? messagesToRows(messages)        : [];
    default: return [];
  }
}

export async function buildWorkbookBlob(datasets, opts = {}) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  let sheetsAdded = 0;
  for (const def of SHEET_DEFS) {
    // Skip sheets whose underlying dataset wasn't extracted at all.
    if (!datasets[def.key]) continue;

    const rows = rowsForKey(def.key, datasets, opts);
    // Skip sheets with zero data rows (extracted but empty after filters).
    if (rows.length === 0) continue;

    const aoa = [def.columns, ...rows.map((r) => def.columns.map((c) => r[c] ?? ""))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Bold header row
    for (let i = 0; i < def.columns.length; i++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[addr]) ws[addr].s = { font: { bold: true } };
    }
    // Freeze top row
    ws["!freeze"] = { ySplit: 1 };
    if (!ws["!views"]) ws["!views"] = [{ state: "frozen", ySplit: 1, topLeftCell: "A2" }];

    // Column widths based on content length, capped so giant message bodies
    // don't push columns to the right edge of the screen.
    ws["!cols"] = def.columns.map((col) => {
      let max = col.length;
      for (const r of rows) {
        const v = String(r[col] ?? "");
        if (v.length > max) max = Math.min(v.length, 60);
      }
      return { wch: Math.max(10, max + 2) };
    });

    XLSX.utils.book_append_sheet(wb, ws, def.name);
    sheetsAdded++;
  }

  if (sheetsAdded === 0) {
    throw new Error("Çıkarılmış veri yok. Önce en az bir sekmede 'Çıkar' deyin.");
  }

  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  return new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
