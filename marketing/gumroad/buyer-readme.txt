WA Contacts Exporter Pro

Thanks for buying. Below is everything you need to get going. It's
shorter than it looks; most of this is troubleshooting tips you
hopefully won't need.


Your license key

Gumroad emailed it to the address you used at checkout. If you
can't find the email, the key is also visible in your Gumroad
library at gumroad.com/library. Click on "WA Contacts Exporter
Pro" and it's on that page.


Activation

You need the free extension first. If it's not installed yet,
grab it from bluedev.dev/products/wa-contacts-exporter and add
it to Chrome.

Once that's done, open web.whatsapp.com and sign in normally.
The extension reads from your existing session, so there's no
separate login.

Click the blue WA icon in your Chrome toolbar to open the
extension popup, then click the "Pro 🔑" tab on the right side
of the tab strip. Paste the email you used at checkout, paste
your license key, then click "Aktive et". You should see
"Pro ✓" within about five seconds.

If activation fails, it's almost always one of two things:
either the email doesn't match what you used to buy, or there's
a stray space in the key. If neither of those is it, write to
destek@bluedev.dev with your purchase email and I'll sort it.


What Pro turns on

It's the same extension you already have. The key just flips
on three things that are otherwise locked.

The AI Assistant tab. Chat summaries, reply suggestions written
in your own style, an inbox triage that ranks chats by how
urgently they need an answer. You pick the AI provider —
Ollama or LM Studio for local and free, or Claude, ChatGPT,
Gemini, or Groq if you'd rather use a cloud API with your own
key.

The Auto-Reply tab. Drafts replies for incoming messages.
Default mode is Draft, so the extension shows you the
suggestion and you decide whether to send it. There are rate
limits and quiet hours so it doesn't run wild on your behalf.

Bigger exports. Up to 5,000 messages per chat instead of 500.
Same CSV / XLSX / VCard formats.


Setting up an AI provider

If you've never used an LLM API before, Ollama is the easiest
free option. Install it from ollama.com, then before you start
it, set the environment variable OLLAMA_ORIGINS to
chrome-extension://* (otherwise the extension can't connect).
Then run:

  ollama pull aya-expanse:8b

That's a Turkish-friendly model and it's a good default.

If you'd rather use a cloud API, the keys live here:

  Claude   - console.anthropic.com/settings/keys
  ChatGPT  - platform.openai.com/api-keys
  Gemini   - aistudio.google.com/apikey   (free tier)
  Groq     - console.groq.com/keys        (free tier)

In the AI tab, pick your provider from the dropdown, paste the
API key (or set the local URL for Ollama / LM Studio), pick a
model, and click "Bağlantıyı test et" to verify the connection.
Once that comes back green, every Pro feature is on.


License terms in plain language

One-time payment, lifetime use, all future Pro updates included.
No subscription, no future charges.

You can install it on your personal devices (laptop, desktop,
etc.) and activate Pro on each. Same key works across them.
Just don't share or resell the key, please.

The license verifies once when you activate, then re-checks
weekly in the background. If you go offline, Pro stays active
for 30 days from the last successful check, so traveling or
patchy wifi won't lock you out.

Refunds within 30 days, no questions, through Gumroad's normal
flow.


Privacy

The extension reads data from your own WhatsApp Web session and
processes it on your device. AI requests go from your browser
straight to the provider you chose, with your own API key. I
don't proxy that traffic and I don't store anything on my side.

The only call my code makes back to a server is the license
verification to Gumroad, and that request only contains your
key. It doesn't include your messages, contacts, or anything
else.

GDPR, KVKK, CCPA: this tool gives you access to data that's
already in your own session. Whether you're allowed to export
or process that data is on you, not on the tool.


Help

destek@bluedev.dev. I aim for a one-business-day response on
Pro support.

If something's broken, click "Hata raporu kopyala" in the
extension popup before emailing. That copies a JSON snippet
with your WA Web version, OS, and the actual error message.
Saves us a back-and-forth.

Web: bluedev.dev/products/wa-contacts-exporter


Legal

WA Contacts Exporter is an independent project. It's not
affiliated with, endorsed by, or sponsored by WhatsApp LLC or
Meta Platforms Inc. WhatsApp is a trademark of WhatsApp LLC.


That's everything. Hope it saves you time.

Aydoğan
Bluedev
