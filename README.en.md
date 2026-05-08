# WA Contacts Exporter

A Chrome extension (Manifest V3) that exports your WhatsApp Web chats, groups, labels, and contacts to **CSV / XLSX / VCard** + generates summaries, reply suggestions, and chat triage with AI.

> Built by Bluedev · v1.0.0 · 🇬🇧 English (Türkçe sürüm: [README.md](./README.md))

[![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE) [![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)](./manifest.json) [![GDPR](https://img.shields.io/badge/GDPR-compliant-green)](./PRIVACY.md)

---

## Features

### 📤 Data export

- 🟢 **Chat list** — all 1-on-1 and group chats, with last-message timestamps
- 💬 **Messages** — per-chat history (100–5000 messages per chat)
- 👥 **Group members** — participants per group with admin / super-admin flags
- 🏷️ **Labels** — WhatsApp Business labels (system filters marked separately)
- 📒 **All Contacts** — saved + (opt-in) unsaved contacts
- 📤 Three formats: **CSV** (UTF-8 BOM, Excel-compatible), **XLSX** (5 sheets, lazy-loaded), **VCard 3.0**

### 🤖 AI Assistant

Six providers — local or cloud, your choice:

| Provider | Type | API key | Cost |
|---|---|:---:|---|
| **Ollama** (recommended) | 🟢 Local | Not needed | $0 |
| **LM Studio / llama.cpp** | 🟢 Local | Not needed | $0 |
| **Anthropic Claude** | ☁️ Cloud | Required | $0.001–$0.05 / request |
| **OpenAI ChatGPT** | ☁️ Cloud | Required | $0.0002–$0.005 / request |
| **Google Gemini** | ☁️ Cloud | Required | **Free tier** (1500 req/day) |
| **Groq** | ☁️ Cloud | Required | **Free tier** + ultra-fast |

#### AI capabilities
- **Summarize chat** — main topics + action items + tone
- **Reply suggestions** — iterative single-suggestion (Refresh / Refine / Feedback)
- **Follow-up reminders** — for messages still awaiting a response
- **Triage** — hybrid (rule-based score + AI rationale, with verification UI)
- **Voice mimicry** — learns the user's writing style from past outgoing messages

### 🤖 Auto-reply

AI replies to incoming messages. **Default = Draft mode**: AI proposes, you approve and send. Auto-send is opt-in per chat.

**Safety layers:**
- Master switch (default off)
- Hourly / daily rate limit (default: 10/hour, 50/day)
- Quiet hours (e.g. 22:00–08:00)
- Per-chat opt-in
- Audit log

### 🔒 Privacy & GDPR

- ✅ First-run consent screen (mandatory)
- ✅ "Include unsaved contacts" toggle defaults OFF
- ✅ All data local — nothing goes to Bluedev
- ✅ AI requests go **directly** from browser to provider, no Bluedev relay
- ✅ API keys stored only in `chrome.storage.local`

Details: [PRIVACY.md](./PRIVACY.md)

---

## Installation

### Beta release (current)

Chrome Web Store approval pending. For beta:

```bash
git clone <private-repo-url> wa-contacts-exporter
cd wa-contacts-exporter
npm install
npm run build
```

Then in Chrome:
1. `chrome://extensions` → toggle **Developer mode**
2. Click **"Load unpacked"** → select `wa-contact/dist/`
3. The extension appears as "WA Contacts Exporter"
4. Accept the consent screen on first launch

### Requirements

- **Chrome** 111+ (Manifest V3 + content_script world: MAIN)
- **Node.js** 18+ (for building)
- (Optional) **Ollama** for local AI: [ollama.com/download](https://ollama.com/download)

---

## Usage

### 1. Log in to WhatsApp Web

Open `https://web.whatsapp.com` → scan QR with phone → wait for chats to load.

### 2. Open the popup

Click the blue **WA** icon in the toolbar. Health probe completes in 5–15 s:
- 🟢 **"WhatsApp Web detected ✓"** — ready
- 🔴 error message — refresh the page

### 3. Pick a tab

| Tab | What for |
|---|---|
| **Chats** | 1-on-1 + group list |
| **Messages** | Message history (source for AI) |
| **AI ✨** | Summarize / Suggest replies / Triage |
| **Auto-Reply 🤖** | Auto-respond to incoming messages |
| **Groups** | Group chats + member list |
| **Labels** | WhatsApp Business labels |
| **All Contacts** | Contact collection |

### 4. Extract + download

In the relevant tab click "Extract" → preview table → choose CSV / XLSX / VCard.

### 5. Working with AI

1. **Messages** tab → extract messages for the relevant chat (preferably with "Earlier-message load rounds = 5+")
2. **AI** tab → choose a provider (Ollama recommended) → Save
3. Select the chat → "Generate summary" / "Generate suggestion"
4. If you don't like it, use **Refresh** or **Refine** to iterate

### For better AI quality

WA Web only keeps about the last 50 messages per chat in RAM. For older context:
- Open that chat in WA Web → **scroll all the way up** → re-extract
- Or set "Earlier-message load rounds" to **5+**

---

## Limitations

- **WA Web version drift**: Meta updates its Store API every 2–3 months; the extension has multi-shape matchers but some versions may need a quick patch
- **GroupMetadata** module may show "OPTIONAL" on some versions — fallbacks still list groups
- **Message limit**: due to WA Web's memory model, full chat history doesn't auto-load; manual scroll may be required
- **Auto-reply runs while popup is open** — when popup is closed, new-message orchestration stops (will move to background SW in a future release)
- **Turkish-only UI** — English locale planned

## Version compatibility

Tested on WA Web 2.3000.x (May 2026). If you encounter incompatibility, use the popup's "Copy error report" button to send a report.

---

## Development

```bash
npm run dev       # Vite dev server + popup HMR
npm run build     # production build → dist/
npm run icons     # SVG → PNG (16/48/128)
npm run package   # build + zip → wa-contacts-exporter-1.0.0.zip
```

### Architecture

```
src/
├── content/inject.js        # MAIN world @ document_start (window.__d hook)
├── content/content.js       # ISOLATED world: relay + script-tag injection
├── background.js            # MV3 service worker: download relay
├── popup/                   # 7-tab UI (vanilla JS, ~33 KB gzip)
├── lib/
│   ├── csv.js               # PapaParse + UTF-8 BOM
│   ├── xlsx.js              # SheetJS (lazy import)
│   ├── vcard.js             # VCard 3.0 hand-rolled
│   └── ai.js                # 6-provider unified API
└── utils/storage.js         # chrome.storage.local wrapper
```

---

## License

This software is the proprietary property of Bluedev. **All rights reserved.** Details: [LICENSE](./LICENSE)

For commercial licensing / partnerships: [bluedev.dev](https://bluedev.dev)

## Contact

- **Web**: [bluedev.dev](https://bluedev.dev)
- **Support**: bluedev.dev/contact
- **Bug reports**: extension popup → "Copy error report" → paste JSON into the contact form

---

## Disclaimer

This extension is **not an official WhatsApp / Meta product** and is not affiliated with, endorsed by, or sponsored by WhatsApp LLC or Meta Platforms Inc. The WhatsApp trademark is owned by WhatsApp LLC. The extension only accesses data from the user's **own device**, in the user's **own WhatsApp Web session**.

Compliance with **GDPR / KVKK / data-protection laws** for any extracted data is **the user's responsibility**. Bluedev never sees, stores, or shares any user data.
