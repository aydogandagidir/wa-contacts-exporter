# Chrome Web Store Listing — English

> This file is pasted into the CWS Developer Console under **Store listing → English (en)**.
> All length limits comply with Google's policies as of March 2026.

---

## Title (45 character limit)

```
WA Contacts Exporter — WA Web Export + AI
```
*(41 characters ✓)*

**Alternative titles (backup):**
- `WA Contacts Exporter — WhatsApp Export` *(38 characters)*
- `WhatsApp Web Export + AI · Bluedev` *(34 characters)*

> ⚠️ **Brand caveat:** Using "WA" instead of the full "WhatsApp" name in the title respects Meta brand guidelines. CWS reviewers may apply extra scrutiny when seeing the full brand name in titles; "WA" is the safer choice.

---

## Short description (132 character limit)

```
Export your WhatsApp Web chats, contacts and messages (CSV/XLSX/VCard). Generate summaries and reply suggestions with local or cloud AI.
```
*(132 characters ✓)*

---

## Category

**Primary category:** Productivity
**Secondary category:** Workflow & Planning

---

## Languages

- ☑️ English
- ☑️ Turkish

---

## Full description (16,384 character limit — Markdown supported)

```markdown
# WA Contacts Exporter — WhatsApp Web Export + AI Assistant

Export your WhatsApp Web data to CSV, XLSX or VCard with a single click. Process chats, contacts, groups, labels and message history entirely in your browser, with no server upload. Plus an **optional AI assistant** to summarize chats, generate reply suggestions, and prioritize your inbox.

## 📤 Export features

- **Chats** — all 1-on-1 and group chats, with last-message timestamps
- **Messages** — per-chat history (100 to 5000 messages, user-controlled)
- **Group members** — participant lists per group with admin / super-admin flags
- **Labels** — WhatsApp Business labels (system filters marked separately)
- **Saved contacts** — all WA users in your phonebook
- **Unsaved contacts** — users you've chatted with but who aren't in your address book (default OFF, opt-in)

**Three formats:**
- **CSV** — UTF-8 BOM, opens cleanly in Excel with non-ASCII characters
- **XLSX** — 5-sheet workbook (chats, messages, groups, labels, contacts)
- **VCard 3.0** — standard card format you can import into your phonebook

## 🤖 AI Assistant (optional)

Choose from six providers based on your preference:

| Provider | Type | Cost | API Key |
|---|:---:|:---:|:---:|
| **Ollama** (recommended) | 🟢 Local | Free | Not needed |
| **LM Studio / llama.cpp** | 🟢 Local | Free | Not needed |
| **Anthropic Claude** | ☁️ Cloud | $0.001 - $0.05 / request | Required |
| **OpenAI ChatGPT** | ☁️ Cloud | $0.0002 - $0.005 / request | Required |
| **Google Gemini** | ☁️ Cloud | **Free tier** (1500 req/day) | Required |
| **Groq** | ☁️ Cloud | **Free tier** + ultra fast | Required |

### AI capabilities

- **Summarize chat** — main topics, action items, and tone analysis
- **Reply suggestions** — iterative single-suggestion flow (Refresh / Refine / Feedback)
- **Follow-up reminders** — gentle suggestions for unanswered messages
- **Triage (prioritization)** — hybrid rule-based score + AI rationale, with verification UI
- **Voice mimicry** — AI learns your writing style from past outgoing messages

## 🤖 Auto-reply module

AI replies to incoming messages. **Default = Draft mode**: AI proposes, you approve and send. Auto-send is opt-in per chat.

**Safety layers:**
- ✅ Master switch (default OFF)
- ✅ Hourly / daily rate limit (default: 10/hour, 50/day)
- ✅ Quiet hours (e.g. 22:00–08:00, no sending)
- ✅ Per-chat opt-in
- ✅ Audit log of all sends

## 🔒 Privacy & GDPR

- ✅ First-run consent screen (mandatory)
- ✅ "Include unsaved contacts" toggle defaults OFF
- ✅ All data local — **nothing** is sent to Bluedev servers
- ✅ AI requests go **directly** from your browser to the provider, no Bluedev relay
- ✅ API keys stored only in `chrome.storage.local`
- ✅ Transparent open-source dependency chain (PapaParse, SheetJS)

## 📋 Usage

1. **Sign in to WhatsApp Web** (`web.whatsapp.com`)
2. **Click the blue WA icon** → 5-15 second health check
3. **Pick a tab**: Chats / Messages / AI / Auto-Reply / Groups / Labels / All Contacts
4. **"Extract"** → Preview table → Download (CSV/XLSX/VCard)
5. For AI: **AI ✨** tab → Pick a provider → "Summarize chat" / "Suggest reply"

## ⚙️ System requirements

- Chrome 111+ (or compatible Chromium-based browser)
- WhatsApp Web account (paired with your phone)
- For local AI: Ollama or LM Studio installed (optional)
- For cloud AI: API key from the chosen provider (optional)

## ⚠️ Limitations

- WhatsApp Web only keeps the last ~50 messages per chat in RAM; for older messages, scroll up in the chat or set "Earlier-message load rounds = 5+"
- WhatsApp Web version updates (every 2-3 months) may shift internal modules; the extension updates accordingly
- Auto-reply runs while popup is open; closing popup disables it (will move to background SW in a future release)
- Bilingual UI: English (default) and Turkish, with a language switcher in the popup header

## 📞 Contact & Support

- **Web**: bluedev.dev
- **Support**: bluedev.dev/contact
- **Bug reports**: in the extension popup, click "Copy error report" → paste the JSON into our support form

## ⚖️ Legal

This extension is **not an official WhatsApp / Meta product** and is not affiliated with, endorsed by, or sponsored by WhatsApp LLC or Meta Platforms Inc. The WhatsApp trademark is owned by WhatsApp LLC.

It accesses data from the user's **own device**, in the user's **own WhatsApp Web session**. Compliance with **GDPR / CCPA / data-protection laws** for any extracted data is **the user's responsibility**.

**Single purpose declaration:** Export the user's own WhatsApp Web data locally and process it through an optional AI assistant.

---

Built by Bluedev · All rights reserved · v1.0.0
```

---

## Single Purpose Declaration (CWS form)

```
This extension is designed to export the user's own WhatsApp Web data (chats, messages, contacts, groups, labels) locally and to optionally process that data through an AI assistant for summarization, reply suggestions, and prioritization. All AI operations occur with a user-selected provider (local Ollama/LM Studio or cloud Claude/ChatGPT/Gemini/Groq). Bluedev never accesses, stores, or transmits any user data.
```

---

## Privacy practices URL

✅ **LIVE**: `https://bluedev.dev/privacy`

Hosted as a Next.js page within the Bluedev main site, with KVKK + GDPR (TR + EN) content. Paste this URL into the CWS submission's Step 5 "Privacy practices URL" field.

---

## Promotional images (CWS upload)

| Image | Size | Required? | Description |
|---|:---:|:---:|---|
| Small tile | 440×280 PNG | ✅ Yes | Search-results small thumbnail |
| Large tile | 920×680 PNG | ⚠️ Recommended | Detail-page header |
| Marquee | 1400×560 PNG | ❌ Optional | Featured listing (if needed) |
| Screenshots | 1280×800 PNG × 5 | ✅ Yes | UI screenshots from `docs/screenshots/en/` |

---

## Submission notes

- **Review time**: Typically 3-7 business days; first submission may be longer
- **If rejected**: refine the permission/policy reason cited by the CWS reviewer's email against this document, then resubmit
- **Versioning**: when v1.0.1 ships, these texts get refreshed in the next submission
- **Brand caveat**: in title and description prefer "WA" or "WhatsApp Web" over the full "WhatsApp" name; phrase as "for WhatsApp Web" to align with Meta brand guidelines
