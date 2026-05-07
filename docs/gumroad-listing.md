# Gumroad Listing — WA Contacts Exporter Pro

> Pasted into the Gumroad product page editor. Markdown-style hints; copy plain text into the rich-text editor.

---

## Title (60 char max recommended)

```
WA Contacts Exporter Pro — WhatsApp Web Export + AI Assistant
```

## Subtitle / one-liner

```
Lifetime Pro license: AI summaries, smart auto-reply, and 5000-message exports for the free Chrome extension.
```

## Cover image
- **File**: `landing/assets/promo/gumroad-cover-1280x720.png` *(create from existing 1400×560 marquee — center-crop to 16:9)*
- Recommended dimensions: 1280×720 (Gumroad cover ratio)

## Thumbnail
- **File**: `landing/assets/promo/gumroad-thumb-600x600.png` *(create from existing 920×680 large-tile — center square crop)*
- Recommended: 600×600 square

## Gallery (5 screenshots — already exist)
1. `landing/assets/screenshots/01_sohbetler_tab.png`
2. `landing/assets/screenshots/02_mesajlar_tab.png`
3. `landing/assets/screenshots/03_ai_tab.png`
4. `landing/assets/screenshots/04_oto_cevap.png`
5. `landing/assets/screenshots/05_oto_cevap.png`

---

## Price
- **$29 USD** — one-time payment, lifetime license
- Currency: USD (Gumroad auto-converts for global buyers)
- "Pay what you want" toggle: OFF
- Recommended price range tested: $19 (low), $29 (target), $49 (premium tier — leave room to add a Team license later)

## License key generation
- ✅ **Generate license keys** must be **ON** (Gumroad → Edit product → Sales settings)
- Without this, in-extension activation does not work

## Refund policy
- 30 days, no questions asked (Gumroad default)

---

## Product description (paste into Gumroad description editor)

> Plain paragraphs only. Gumroad's rich-text editor doesn't render markdown
> tables / `###` headers, and a wall of bullet points reads like ad copy.
> Below is the human-tone version. Paste as-is, or run it through the
> Bold (B) toolbar button on the section openers if you want emphasis.

```
WhatsApp Web has no export button. If you've ever needed to back up your contacts, hand a chat history to a client, or pull a group's member list out, you know how painful that is.

I built WA Contacts Exporter to fix that for myself, then put the free version on the Chrome Web Store. It runs entirely in your browser and exports to CSV, XLSX, or VCard. Your data never touches a server.

This Pro license unlocks the AI features inside the same extension.

What you get with Pro: chat summaries, reply suggestions written in your own style, smart auto-reply with quiet hours and rate limits, and an inbox triage that ranks your chats by how urgently they need an answer. Pro also raises the message export ceiling from 500 to 5,000 per chat.

About the AI side: I don't run any AI servers and Pro doesn't charge per request. You bring your own provider. Run Ollama or LM Studio locally for free, or use Claude, ChatGPT, Gemini, or Groq with your own API key. Most of the cloud options have a free tier that covers personal use comfortably.

Activating it takes about a minute. You install the free extension from bluedev.dev/products/wa-contacts-exporter, open the Pro tab inside the popup, paste your purchase email and license key, hit Activate. Same binary as the free version — your key just flips Pro on.

The price is $29, paid once. That's the lifetime license. All future Pro updates are included, no subscription, no future charges. You can install it on your personal devices (laptop, desktop, etc.) and activate Pro on each — same key works across them. Refunds within 30 days through Gumroad, no questions.


A few things people often ask.

Do I need to install something extra after I buy? No. You install the same free extension, then enter your key in the Pro tab. Same one binary; the key just turns the locked features on.

I lost my key. Resend it from your Gumroad library, or write to me at destek@bluedev.dev with the email you used at checkout.

Will it still work if Bluedev disappears? License verification calls Gumroad directly, not my servers, and there's a 30-day offline grace window after each successful check. So even if my site went down for some reason, your install would keep working until the next re-verify failed.

Does Bluedev see my WhatsApp data? No. The extension processes everything on your device. AI calls go from your browser straight to whatever provider you picked, with your own key. The only network call my code makes is to Gumroad to verify your license, and that request only contains your key — nothing about your messages, contacts, or anything else.

Is this affiliated with WhatsApp or Meta? No. Independent project. WhatsApp is their trademark.


For support, write to destek@bluedev.dev. I aim for one business day on Pro support. Bug reports go faster if you click "Hata raporu kopyala" in the extension popup before emailing — that copies a JSON blob with the WA Web version, your OS, and the actual exception, which makes problems much faster to reproduce.

GDPR, KVKK, CCPA: this tool gives you access to what's already in your own WhatsApp Web session. Whether you're allowed to export or process that data is on you, not on the tool.

Site: bluedev.dev/products/wa-contacts-exporter
```

---

## Content delivered to buyer (Gumroad "Content" upload)

Upload `marketing/gumroad/buyer-readme.txt` as the product file. Gumroad
delivers it plus the unique license key by email automatically.

## Gumroad settings checklist

- [ ] Type: **Digital product**
- [ ] Cover image uploaded (1280×720)
- [ ] Thumbnail uploaded (600×600 square)
- [ ] Gallery: 5 screenshots uploaded
- [ ] Price: $29 USD
- [ ] Currency: USD
- [ ] **Generate license keys: ON**
- [ ] Refund policy: 30 days
- [ ] Tags: `chrome-extension`, `whatsapp`, `productivity`, `ai`, `automation`, `export`, `csv`
- [ ] SEO meta description (160 chars):
  ```
  Lifetime Pro license for WA Contacts Exporter — unlocks AI summaries, smart auto-reply, and 5000-message exports. Free Chrome extension, paid AI features.
  ```
- [ ] Content (file upload): `marketing/gumroad/buyer-readme.txt`
- [ ] Custom thank-you message:
  ```
  Thanks for buying. Your license key is in this email.

  To activate: install the free extension from bluedev.dev/products/wa-contacts-exporter, open WhatsApp Web, click the WA icon, then the Pro tab. Paste your email and key, hit Activate. Should take about a minute.

  If something goes wrong, write to destek@bluedev.dev with your purchase email.

  Aydoğan
  ```

## Pre-launch checklist (before going public)

- [ ] Replace `DEFAULT_PRODUCT_ID` in `src/license/license-manager.js` with the real Gumroad product_id (find it in Gumroad URL: `gumroad.com/products/<id>/edit`)
- [ ] Replace `PURCHASE_URL` in `src/license/license-manager.js` with the real product link
- [ ] Test purchase with your own card while listing is "Unlisted"
- [ ] Verify the activation flow end-to-end with the test key
- [ ] Update landing page Buy CTAs to the real Gumroad URL
- [ ] Flip listing from "Unlisted" → "Public"
- [ ] Optional: add Gumroad embed widget to landing page (`<script src="https://gumroad.com/js/gumroad.js"></script>`)
