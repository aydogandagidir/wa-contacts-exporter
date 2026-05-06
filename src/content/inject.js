// MAIN world inject — runs at document_start as a content_script (world:MAIN).
// This is critical: it executes BEFORE WhatsApp Web's bundle assigns
// window.__d, so we can install an Object.defineProperty getter/setter on
// __d and intercept the assignment. From that moment on, every module
// registration in WhatsApp's MetroBundler-style runtime is routed through
// our wrapper, letting us record every moduleId. We then call window.require
// (Meta exposes it directly) for each captured ID and run signature matchers
// to populate window.Store with Chat / Contact / GroupMetadata / Label / etc.

(() => {
  const SOURCE = "wa-exporter";
  const MSG = { WA_HEALTH: "WA_HEALTH", WA_REQ: "WA_REQ", WA_RES: "WA_RES", WA_ERR: "WA_ERR" };

  if (window.__waExporterInjected) return;
  window.__waExporterInjected = true;
  console.log("[wa-exporter] inject.js loaded into MAIN world (document_start)");

  if (!window.Store) window.Store = {};

  // -----------------------------------------------------------------------
  // Module signature matchers — same as before.
  // -----------------------------------------------------------------------
  // Matchers run against `mod` and `mod.default`. They look for either the
  // exact key (Chat / Contact / etc.) or a shape match where the WHOLE module
  // IS the collection (some WA Web modules export the collection as default
  // export, not as a named property).
  // -----------------------------------------------------------------------
  // Helper: extract a class name from any modelClass shape (function, class,
  // or instance with constructor). Modern WA Web bundlers wrap collections
  // in different ways — this normalizes them.
  function modelClassName(mc) {
    if (!mc) return "";
    if (typeof mc === "function") return mc.name || mc.displayName || "";
    if (mc.prototype && mc.prototype.constructor) return mc.prototype.constructor.name || "";
    if (mc.name) return mc.name;
    return "";
  }

  // -----------------------------------------------------------------------
  // MATCHERS — many shape variants per module. We try them in priority order;
  // first match wins. Every variant is wrapped in try/catch upstream.
  // -----------------------------------------------------------------------
  const MATCHERS = {
    Chat: (m) => {
      if (!m) return null;
      if (m.Chat && typeof m.Chat.getModelsArray === "function") return m.Chat;
      if (m.ChatCollection && typeof m.ChatCollection.getModelsArray === "function") return m.ChatCollection;
      if (typeof m.getModelsArray === "function" && /Chat/i.test(modelClassName(m.modelClass))) return m;
      return null;
    },
    Contact: (m) => {
      if (!m) return null;
      if (m.Contact && typeof m.Contact.getModelsArray === "function") return m.Contact;
      if (m.ContactCollection && typeof m.ContactCollection.getModelsArray === "function") return m.ContactCollection;
      if (typeof m.getModelsArray === "function" && /Contact/i.test(modelClassName(m.modelClass))) return m;
      return null;
    },
    GroupMetadata: (m) => {
      if (!m) return null;
      // Classic shape: { GroupMetadata: { find, get, ... } }
      if (m.GroupMetadata && (typeof m.GroupMetadata.find === "function" || typeof m.GroupMetadata.get === "function")) return m.GroupMetadata;
      // Collection-named export
      if (m.GroupMetadataCollection && typeof m.GroupMetadataCollection.find === "function") return m.GroupMetadataCollection;
      // Direct collection — module IS the collection
      const cls = modelClassName(m.modelClass);
      if (/Group(Metadata)?(Collection)?/i.test(cls) && (typeof m.find === "function" || typeof m.get === "function" || typeof m.getModelsArray === "function")) return m;
      // Default export indirection
      if (m.default && m.default.GroupMetadata && typeof m.default.GroupMetadata.find === "function") return m.default.GroupMetadata;
      // Function-based query API: { queryGroupMetadata, getGroupMetadata, ... }
      if (typeof m.queryGroupMetadata === "function" || typeof m.getGroupMetadata === "function") {
        // Wrap it into a find()-compatible object
        return {
          __synth: true,
          __from: "queryGroupMetadata",
          find: (wid) => {
            try {
              if (typeof m.queryGroupMetadata === "function") return Promise.resolve(m.queryGroupMetadata(wid));
              if (typeof m.getGroupMetadata === "function") return Promise.resolve(m.getGroupMetadata(wid));
            } catch {}
            return Promise.resolve(null);
          },
        };
      }
      return null;
    },
    Label: (m) => {
      if (!m) return null;
      if (m.Label && typeof m.Label.getModelsArray === "function") return m.Label;
      if (m.LabelCollection && typeof m.LabelCollection.getModelsArray === "function") return m.LabelCollection;
      if (typeof m.getModelsArray === "function" && /Label/i.test(modelClassName(m.modelClass))) return m;
      return null;
    },
    LabelAssociation: (m) => {
      if (!m) return null;
      if (m.LabelAssociation && typeof m.LabelAssociation.getModelsArray === "function") return m.LabelAssociation;
      if (m.LabelChatAssociation && typeof m.LabelChatAssociation.getModelsArray === "function") return m.LabelChatAssociation;
      if (m.LabelAssociationCollection && typeof m.LabelAssociationCollection.getModelsArray === "function") return m.LabelAssociationCollection;
      if (typeof m.getModelsArray === "function" && /Label.*Assoc/i.test(modelClassName(m.modelClass))) return m;
      // Reverse-direction: Chat.labels collection
      if (m.LabelChat && typeof m.LabelChat.getModelsArray === "function") return m.LabelChat;
      return null;
    },
    WidFactory: (m) => {
      if (!m) return null;
      if (m.WidFactory && typeof m.WidFactory.createWid === "function") return m.WidFactory;
      if (typeof m.createWid === "function" && (typeof m.toUserWid === "function" || typeof m.fromString === "function" || typeof m.fromUserId === "function")) return m;
      return null;
    },
  };

  // Fallback Wid creator — always available even if real WidFactory missing.
  // Modern WA Web Wid format: "<user>@<server>" where server is c.us / g.us / lid.
  function localCreateWid(input) {
    if (!input) return null;
    if (typeof input === "object" && input._serialized) return input; // already a Wid
    let str = String(input).trim();
    if (!str) return null;
    if (str.startsWith("+")) str = str.slice(1);
    if (!str.includes("@")) {
      // Bare phone digits → assume @c.us
      if (/^\d{8,15}$/.test(str)) str = `${str}@c.us`;
      else return null;
    }
    const [user, server] = str.split("@");
    return { user, server: server || "c.us", _serialized: str, isUser: () => server === "c.us", isGroup: () => server === "g.us" };
  }
  // Always expose a synthetic WidFactory so callers don't have to null-check.
  if (!window.Store.WidFactory) {
    window.Store.WidFactory = { createWid: localCreateWid, __synth: true };
  }

  // Resolve a real E.164 phone string for a Wid (id object) + optional contact.
  // Modern WA Web stores many chats under @lid (Linked IDentifier) servers
  // where the user-part is NOT a phone number. Returning that as "+lid"
  // would mislead the export. Strategy:
  //   1. Prefer contact.phoneNumber / formattedPhoneNumber if available.
  //   2. Else, use idObj.user only when server is "c.us" (regular contact)
  //      or "s.whatsapp.net" (some recent builds).
  //   3. Otherwise return null — never fabricate a phone from a LID.
  // Extract a digit-only phone, normalize to +E164. Returns null if none found.
  function digitsToPhone(s) {
    if (s == null) return null;
    const str = String(s).trim();
    if (!str) return null;
    if (str.startsWith("+")) return str;
    const digits = str.replace(/[^\d]/g, "");
    if (digits.length >= 8 && digits.length <= 15) return "+" + digits;
    return null;
  }

  function tryWid(w) {
    if (!w) return null;
    try {
      const server = String(w.server || "").toLowerCase();
      if (server === "c.us" || server === "s.whatsapp.net") {
        const user = w.user || (typeof w._serialized === "string" ? w._serialized.split("@")[0] : null);
        if (user && /^\d+$/.test(user) && user.length >= 8 && user.length <= 15) return "+" + user;
      }
    } catch {}
    return null;
  }

  // Aggressive phone resolver: try every known field on the contact and the
  // chat ID. Many modern WA Web builds put the saved phone in obscure places
  // because the primary id is now an @lid Wid.
  function resolvePhone(idObj, contact) {
    // 1. Explicit phone fields on contact
    if (contact) {
      for (const f of ["phoneNumber", "formattedPhoneNumber", "phone", "number", "userid", "tel"]) {
        try {
          const v = contact[f];
          const p = digitsToPhone(v);
          if (p) return p;
        } catch {}
      }
    }
    // 2. Try Wids: contact.id, contact.userid (sometimes a Wid), then the
    //    chat-level idObj. Prefer c.us / s.whatsapp.net.
    for (const w of [contact && contact.id, contact && contact.userid, idObj]) {
      const p = tryWid(w);
      if (p) return p;
    }
    // 3. Some builds expose contact.lookupExternalId or .pn
    if (contact) {
      for (const f of ["pn", "lookupExternalId", "phoneJid", "phoneWid"]) {
        try {
          const v = contact[f];
          if (typeof v === "string") {
            const p = digitsToPhone(v);
            if (p) return p;
          } else if (v && v.user) {
            const p = tryWid(v);
            if (p) return p;
          }
        } catch {}
      }
    }
    return null;
  }

  // Surface the lid when phone resolution fails — the user at least gets a
  // stable identifier they can match against.
  function lidUser(idObj) {
    try {
      if (idObj && String(idObj.server || "").toLowerCase() === "lid") {
        return idObj.user || (typeof idObj._serialized === "string" ? idObj._serialized.split("@")[0] : null);
      }
    } catch {}
    return null;
  }

  function truncateBody(s, max = 200) {
    if (!s) return null;
    const flat = String(s).replace(/[\r\n\t]+/g, " ").trim();
    if (flat.length <= max) return flat;
    return flat.slice(0, max - 1) + "…";
  }

  // Safely extract a chat record. Each accessor wrapped because the Store
  // model API is private and any property may throw or be absent.
  // For 1-on-1 chats the saved-contact details live on c.contact, NOT on c
  // directly — c.name is often empty even when the user has saved the contact.
  function safeChatRecord(c) {
    const out = {
      id: null, name: null, formattedTitle: null, t: null, unreadCount: 0,
      isGroup: false, lastMessage: null, phone: null, lidUser: null,
      isMyContact: false, contactName: null, pushName: null, formattedName: null,
      verifiedName: null, idServer: null,
      pinned: false, muteExpiration: 0, archived: false,
    };
    let contact = null;
    try { contact = c.contact || null; } catch {}
    try {
      const idObj = c.id;
      if (idObj) {
        out.id = idObj._serialized || (typeof idObj.toString === "function" ? idObj.toString() : null);
        out.idServer = idObj.server || null;
      }
      out.phone = resolvePhone(idObj, contact);
      if (!out.phone) out.lidUser = lidUser(idObj);
    } catch {}
    try { out.name = c.name || null; } catch {}
    try { out.formattedTitle = c.formattedTitle || null; } catch {}
    try { out.t = typeof c.t === "number" ? c.t : null; } catch {}
    try { out.unreadCount = typeof c.unreadCount === "number" ? c.unreadCount : 0; } catch {}
    try { out.pinned = !!(c.pin || c.pinned); } catch {}
    try { out.muteExpiration = typeof c.muteExpiration === "number" ? c.muteExpiration : 0; } catch {}
    try { out.archived = !!c.archive; } catch {}
    try { out.isGroup = !!(c.isGroup || (out.id && out.id.endsWith("@g.us"))); } catch {}
    try {
      const lm = c.lastMessage || (c.msgs && c.msgs.last && c.msgs.last());
      if (lm) {
        out.lastMessage = {
          body: truncateBody(lm.body || lm.caption || null),
          fromMe: !!lm.fromMe,
          t: typeof lm.t === "number" ? lm.t : null,
          type: lm.type || null,
        };
      }
    } catch {}
    try {
      if (contact) {
        out.contactName = contact.name || null;
        out.pushName = contact.pushname || contact.notifyName || null;
        out.formattedName = contact.formattedName || null;
        out.verifiedName = contact.verifiedName || null;
        out.isMyContact = !!contact.isMyContact;
      }
    } catch {}
    return out;
  }

  function safeContactRecord(c) {
    const out = {
      id: null, phone: null, lidUser: null, name: null, pushName: null,
      formattedName: null, verifiedName: null, isMyContact: false,
      isBusiness: false, isUser: true, idServer: null,
    };
    try {
      const idObj = c.id;
      if (idObj) {
        out.id = idObj._serialized || (typeof idObj.toString === "function" ? idObj.toString() : null);
        out.idServer = idObj.server || null;
      }
      out.phone = resolvePhone(c.id, c);
      if (!out.phone) out.lidUser = lidUser(c.id);
    } catch {}
    try { out.name = c.name || null; } catch {}
    try { out.pushName = c.pushname || c.notifyName || null; } catch {}
    try { out.formattedName = c.formattedName || null; } catch {}
    try { out.verifiedName = c.verifiedName || null; } catch {}
    try { out.isMyContact = !!c.isMyContact; } catch {}
    try { out.isBusiness = !!c.isBusiness; } catch {}
    try { out.isUser = c.isUser !== false; } catch {}
    return out;
  }

  // Built-in system filter chips that aren't real user labels but show up in
  // Store.Label.getModelsArray() (WA Web's chat-list filter strip).
  const SYSTEM_LABEL_NAME_RE = /^(Unread|Favorites|Groups|All|Broadcasts|Newsletters|Communities)$/i;

  function safeLabelRecord(l, chatIds) {
    const out = {
      id: null, name: null, color: null, hexColor: null, count: 0, chatIds: [],
      predefinedId: null, isSystem: false, type: null,
    };
    try { out.id = l.id ?? null; } catch {}
    try { out.name = l.name || null; } catch {}
    try { out.color = typeof l.color === "number" ? l.color : null; } catch {}
    try { out.hexColor = l.hexColor || l.colorHex || null; } catch {}
    try {
      const pid = l.predefinedId;
      out.predefinedId = (pid != null && pid !== false) ? pid : null;
    } catch {}
    try { out.type = l.type || null; } catch {}
    out.isSystem = out.predefinedId != null || (out.name && SYSTEM_LABEL_NAME_RE.test(out.name));
    out.chatIds = Array.isArray(chatIds) ? chatIds.slice() : [];
    out.count = out.chatIds.length;
    return out;
  }

  // Compact, defensive message record. Each field is wrapped because the
  // Msg model is private and shape varies between WA Web builds.
  function safeMessageRecord(m, chatId, chatName) {
    const out = {
      message_id: null,
      chat_id: chatId || null,
      chat_name: chatName || null,
      sender_id: null,
      sender_phone: null,
      sender_name: null,
      type: null,
      body: null,
      from_me: false,
      t: null,
      ack: null,
      is_forwarded: false,
      has_media: false,
    };
    try { out.message_id = m.id?._serialized || (m.id?.id ? `${m.id.fromMe ? "true" : "false"}_${chatId}_${m.id.id}` : null); } catch {}
    // Robust fromMe detection — multiple shape variants in modern WA Web.
    // The serialized key starts with "true_..." (sent by us) or "false_..."
    // (received) which is the most reliable fallback.
    try {
      let fm = false;
      if (typeof m.id?.fromMe === "boolean") fm = m.id.fromMe;
      else if (typeof m.fromMe === "boolean") fm = m.fromMe;
      else {
        const ser = m.id?._serialized || (typeof m.id === "string" ? m.id : "");
        if (ser.startsWith("true_")) fm = true;
        else if (ser.startsWith("false_")) fm = false;
      }
      out.from_me = !!fm;
    } catch {}
    try {
      const senderId = m.author || m.from || m.id?.participant;
      if (senderId) {
        if (typeof senderId === "string") out.sender_id = senderId;
        else if (senderId._serialized) out.sender_id = senderId._serialized;
      }
    } catch {}
    try {
      const senderContact = m.senderObj || (m.author && window.Store?.Contact?.get && window.Store.Contact.get(m.author));
      if (senderContact) {
        out.sender_name = senderContact.name || senderContact.formattedName || senderContact.pushname || null;
        out.sender_phone = resolvePhone(senderContact.id || m.author, senderContact);
      }
    } catch {}
    try { out.type = m.type || null; } catch {}
    try { out.body = truncateBody(m.body || m.caption || (m.type ? `[${m.type}]` : null), 500); } catch {}
    try { out.t = typeof m.t === "number" ? m.t : null; } catch {}
    try { out.ack = typeof m.ack === "number" ? m.ack : null; } catch {}
    try { out.is_forwarded = !!(m.isForwarded || (typeof m.forwardingScore === "number" && m.forwardingScore > 0)); } catch {}
    try { out.has_media = !!(m.mediaData || m.deprecatedMms3Url || m.mimetype); } catch {}
    return out;
  }

  function safeParticipantRecord(p) {
    const out = { id: null, phone: null, lidUser: null, isAdmin: false, isSuperAdmin: false, name: null, idServer: null };
    let contact = null;
    try { contact = p.contact || null; } catch {}
    try {
      const idObj = p.id || (contact && contact.id);
      if (idObj) {
        out.id = idObj._serialized || (typeof idObj.toString === "function" ? idObj.toString() : null);
        out.idServer = idObj.server || null;
      }
      out.phone = resolvePhone(p.id || (contact && contact.id), contact);
      if (!out.phone) out.lidUser = lidUser(idObj);
    } catch {}
    try { out.isAdmin = !!(p.isAdmin || p.type === "admin" || p.type === "superadmin"); } catch {}
    try { out.isSuperAdmin = !!(p.isSuperAdmin || p.type === "superadmin"); } catch {}
    try {
      if (contact) out.name = contact.name || contact.formattedName || contact.pushname || null;
    } catch {}
    return out;
  }

  // Resolve a thenable safely; returns undefined if it throws.
  function safeAwait(p) {
    return Promise.resolve(p).catch(() => undefined);
  }

  function probeModules() {
    const S = window.Store || {};
    return {
      Chat: !!(S.Chat && typeof S.Chat.getModelsArray === "function"),
      GroupMetadata: !!(S.GroupMetadata && (typeof S.GroupMetadata.find === "function" || typeof S.GroupMetadata.get === "function")),
      Label: !!(S.Label && typeof S.Label.getModelsArray === "function"),
      // LabelAssociation may be EITHER a real module OR a synthetic shim built
      // from Chat.labels iteration — both count as "available".
      LabelAssociation: !!(S.LabelAssociation && (typeof S.LabelAssociation.getModelsArray === "function" || S.LabelAssociation.__synth)),
      Contact: !!(S.Contact && typeof S.Contact.getModelsArray === "function"),
      WidFactory: !!(S.WidFactory && typeof S.WidFactory.createWid === "function"),
    };
  }

  // -----------------------------------------------------------------------
  // FUNCTIONAL FALLBACKS — even when the real module isn't found, we use
  // alternative paths to satisfy the same data needs.
  // -----------------------------------------------------------------------

  // Try multiple sources to load group metadata for a chat:
  //   1. Real Store.GroupMetadata.find(chatId)
  //   2. chat.queryGroup() / chat.queryGroupMetadata() — forces lazy load
  //   3. chat.groupMetadata directly
  //   4. chat.participants directly (some builds)
  // Returns participants array (may be empty).
  async function loadGroupMetadataForChat(chat) {
    if (!chat || !chat.id) return [];
    const meta = window.Store?.GroupMetadata;

    // Path 1: Store.GroupMetadata.find / get
    if (meta) {
      try {
        const fn = meta.find || meta.get;
        if (typeof fn === "function") {
          const result = await safeAwait(fn.call(meta, chat.id));
          if (result && result.participants) {
            return participantsToArray(result.participants);
          }
        }
      } catch {}
    }

    // Path 2: query directly on chat
    try {
      if (typeof chat.queryGroup === "function") {
        const r = await safeAwait(chat.queryGroup());
        if (r && r.participants) return participantsToArray(r.participants);
      }
    } catch {}
    try {
      if (typeof chat.queryGroupMetadata === "function") {
        const r = await safeAwait(chat.queryGroupMetadata());
        if (r && r.participants) return participantsToArray(r.participants);
      }
    } catch {}

    // Path 3: chat.groupMetadata directly
    try {
      const gm = chat.groupMetadata;
      if (gm && gm.participants) return participantsToArray(gm.participants);
    } catch {}

    // Path 4: chat.participants directly
    try {
      if (chat.participants) return participantsToArray(chat.participants);
    } catch {}

    return [];
  }

  function participantsToArray(p) {
    try {
      if (typeof p.getModelsArray === "function") return p.getModelsArray();
      if (Array.isArray(p)) return p;
      if (Array.isArray(p._models)) return p._models;
      if (typeof p.toArray === "function") return p.toArray();
    } catch {}
    return [];
  }

  // Build a synthetic LabelAssociation by iterating Chat.labels on every chat.
  // Returns array of { labelId, chatId } pairs. Cached on first build.
  let _synthLabelAssoc = null;
  function buildSyntheticLabelAssociations(force = false) {
    if (_synthLabelAssoc && !force) return _synthLabelAssoc;
    const out = [];
    const seen = new Set();
    try {
      const chats = window.Store?.Chat?.getModelsArray?.() || [];
      for (const c of chats) {
        let labels = null;
        try { labels = c.labels; } catch {}
        if (!labels) continue;
        const arr = Array.isArray(labels) ? labels
          : (typeof labels.getModelsArray === "function" ? labels.getModelsArray()
          : (Array.isArray(labels._models) ? labels._models : []));
        const chatId = c.id?._serialized;
        if (!chatId) continue;
        for (const lab of arr) {
          const labelId = lab?.id ?? lab?.labelId ?? lab;
          if (labelId == null) continue;
          const key = `${labelId}::${chatId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ labelId, chatId });
        }
      }
    } catch {}
    _synthLabelAssoc = out;
    return out;
  }

  // After Chat module is resolved, install a synthetic LabelAssociation if
  // the real one wasn't found. Lets the popup show the module as "ready"
  // (via fallback) instead of permanently grey.
  function maybeInstallLabelAssociationShim() {
    const S = window.Store;
    if (!S || S.LabelAssociation) return;
    if (!S.Chat || typeof S.Chat.getModelsArray !== "function") return;
    S.LabelAssociation = {
      __synth: true,
      __from: "Chat.labels iteration",
      getModelsArray: () => {
        const pairs = buildSyntheticLabelAssociations();
        // Adapt to LabelAssociation shape: each entry has labelId + parentId
        return pairs.map((p) => ({ labelId: p.labelId, parentId: p.chatId, chatId: p.chatId }));
      },
    };
  }

  // -----------------------------------------------------------------------
  // __d interception via Object.defineProperty. We replace window.__d with a
  // getter/setter so that when WhatsApp's bundle does `window.__d = realD`,
  // our setter fires, wraps `realD`, and stores the wrapper. From then on,
  // every `__d(...)` call in the bundle is observable.
  //
  // The DIAG output for this build showed: __d source = function (e,t,n,r){
  //   Te()(function(){oe(e,t,n,(r!=null?r:m)|_,null,null,null)},"define "+e,...)
  // The first parameter `e` ends up logged as "define " + e — meaning e is
  // the moduleId. So __d's first argument is the moduleId.
  // -----------------------------------------------------------------------
  const moduleIds = new Set();
  let originalD = null;
  let wrappedD = null;
  let interceptionInstalled = false;

  function installDInterception() {
    if (interceptionInstalled) return;
    interceptionInstalled = true;

    // If __d already exists (we lost the race or this is a re-injection),
    // wrap in place. This is a normal recovery path — NOT an error condition.
    const existing = Object.getOwnPropertyDescriptor(window, "__d");
    if (existing && existing.value && typeof existing.value === "function") {
      console.log("[wa-exporter] __d already defined when inject ran — wrapping in place (normal)");
      installWrapper(existing.value);
    }

    try {
      Object.defineProperty(window, "__d", {
        configurable: true,
        get() { return wrappedD; },
        set(value) { installWrapper(value); },
      });
      console.log("[wa-exporter] __d getter/setter installed at document_start");
    } catch (err) {
      // Genuine failure — this DOES warrant an error so devs can see it,
      // but only if defineProperty actually rejected the operation.
      console.error("[wa-exporter] failed to install __d interception:", err);
    }
  }

  function installWrapper(realD) {
    if (typeof realD !== "function") {
      originalD = realD;
      wrappedD = realD;
      return;
    }
    if (realD === wrappedD) return; // already wrapped
    originalD = realD;
    wrappedD = function () {
      // First argument is the moduleId in this WA Web build.
      const id = arguments[0];
      if (id !== undefined && id !== null) moduleIds.add(id);
      return originalD.apply(this, arguments);
    };
    // Preserve any decorations the bundle may attach to __d
    for (const k of Object.getOwnPropertyNames(realD)) {
      if (["length", "name", "prototype", "caller", "arguments"].includes(k)) continue;
      try { wrappedD[k] = realD[k]; } catch {}
    }
    console.log("[wa-exporter] __d wrapped — recording moduleIds");
  }

  installDInterception();

  // -----------------------------------------------------------------------
  // Resolution: once we have moduleIds + window.require, walk each module
  // and run signature matchers. We re-run periodically because some modules
  // may not be registered until after login.
  // -----------------------------------------------------------------------
  function walkAndPopulate() {
    if (typeof window.require !== "function") return { walked: 0, hits: 0 };
    let walked = 0, hits = 0;
    for (const id of moduleIds) {
      walked++;
      let mod;
      try { mod = window.require(id); } catch { continue; }
      if (!mod) continue;
      const candidates = [mod, mod.default];
      for (const cand of candidates) {
        if (!cand) continue;
        for (const [key, matcher] of Object.entries(MATCHERS)) {
          if (window.Store[key]) continue;
          let resolved = null;
          try { resolved = matcher(cand); } catch {}
          if (resolved) {
            window.Store[key] = resolved;
            hits++;
            console.log(`[wa-exporter] resolved Store.${key} from module ${String(id).slice(0, 80)}`);
          }
        }
      }
    }
    // After populate, install LabelAssociation shim if real one was missed.
    maybeInstallLabelAssociationShim();
    return { walked, hits };
  }

  // -----------------------------------------------------------------------
  // Probe loop.
  // -----------------------------------------------------------------------
  const POLL_INTERVAL_MS = 500;
  const POLL_TIMEOUT_MS = 30000;

  let lastHealth = null;
  function setHealth(detail) {
    lastHealth = detail;
    window.postMessage({ source: SOURCE, type: MSG.WA_HEALTH, ...detail }, window.location.origin);
  }

  // Required vs optional modules.
  //   Chat is the core — without it nothing works.
  //   Contact + Label are needed for the All Contacts / Labels tabs.
  //   GroupMetadata / LabelAssociation / WidFactory have evolving shapes in
  //   modern WhatsApp Web; we treat them as optional so a missing one doesn't
  //   block the rest of the extension.
  const REQUIRED_KEYS = ["Chat"];

  let activePoller = null;
  let probeFinished = false;
  let lastReportedModuleCount = 0;

  function finalizeHealth(probe, reason) {
    if (probeFinished) return;
    probeFinished = true;
    if (activePoller) {
      clearInterval(activePoller);
      activePoller = null;
    }
    const ok = REQUIRED_KEYS.every((k) => probe[k]);
    setHealth({
      ok,
      reason: ok ? undefined : reason,
      modules: probe,
      waVersion: (window.Debug && window.Debug.VERSION) || null,
      moduleCount: moduleIds.size,
      ts: Date.now(),
    });
    if (ok) {
      const allOptional = Object.entries(probe).every(([_, v]) => v);
      const missing = Object.entries(probe).filter(([_, v]) => !v).map(([k]) => k);
      const note = allOptional ? "" : ` (missing optionals: ${missing.join(", ")})`;
      console.log(`[wa-exporter] Store ready${note} — ${moduleIds.size} modules scanned`);
    } else {
      console.warn(`[wa-exporter] probe finalized: ${reason} (modules captured: ${moduleIds.size})`, probe);
    }
  }

  function probeSignature(probe) {
    return Object.values(probe).map((v) => (v ? "1" : "0")).join("");
  }

  let lastSig = "";
  function broadcastIntermediate(probe) {
    const sig = probeSignature(probe);
    if (sig === lastSig) return;
    lastSig = sig;
    const requiredOk = REQUIRED_KEYS.every((k) => probe[k]);
    lastHealth = {
      ok: requiredOk,
      reason: requiredOk ? undefined : "in-progress",
      modules: probe,
      waVersion: (window.Debug && window.Debug.VERSION) || null,
      moduleCount: moduleIds.size,
      ts: Date.now(),
      provisional: true,
    };
    window.postMessage({ source: SOURCE, type: MSG.WA_HEALTH, ...lastHealth }, window.location.origin);
  }

  function startProbe() {
    if (activePoller) {
      clearInterval(activePoller);
      activePoller = null;
    }
    probeFinished = false;
    lastReportedModuleCount = 0;
    lastSig = "";
    const start = Date.now();

    const tick = () => {
      if (probeFinished) return;

      // Periodic progress log so we can see capture happening.
      if (moduleIds.size > 0 && moduleIds.size !== lastReportedModuleCount) {
        const delta = moduleIds.size - lastReportedModuleCount;
        if (lastReportedModuleCount === 0 || moduleIds.size % 1000 === 0 || delta > 500) {
          console.log(`[wa-exporter] captured ${moduleIds.size} moduleIds so far`);
        }
        lastReportedModuleCount = moduleIds.size;
      }

      walkAndPopulate();
      const probe = probeModules();
      broadcastIntermediate(probe); // popup never sees stale "not-yet-probed"

      const fullOk = Object.values(probe).every(Boolean);
      const requiredOk = REQUIRED_KEYS.every((k) => probe[k]);

      if (fullOk) {
        finalizeHealth(probe, undefined);
        return;
      }

      const elapsed = Date.now() - start;
      if (elapsed > POLL_TIMEOUT_MS) {
        if (requiredOk) {
          finalizeHealth(probe, undefined);
        } else {
          const reason = !interceptionInstalled
            ? "interception-not-installed"
            : moduleIds.size === 0
            ? "no-modules-captured"
            : typeof window.require !== "function"
            ? "require-missing"
            : "modules-not-found";
          finalizeHealth(probe, reason);
        }
      }
    };

    tick();
    if (!probeFinished) activePoller = setInterval(tick, POLL_INTERVAL_MS);
  }

  startProbe();

  // -----------------------------------------------------------------------
  // Request handler — popup talks to us via content.js → window.postMessage.
  // -----------------------------------------------------------------------
  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== SOURCE || data.type !== MSG.WA_REQ) return;
    const { reqId, op } = data;
    try {
      let result;
      switch (op) {
        case "get-health": {
          if (lastHealth) {
            result = lastHealth;
          } else {
            const probe = probeModules();
            const requiredOk = REQUIRED_KEYS.every((k) => probe[k]);
            result = {
              ok: requiredOk,
              reason: requiredOk ? undefined : "not-yet-probed",
              modules: probe,
              moduleCount: moduleIds.size,
              ts: Date.now(),
              provisional: true,
            };
          }
          break;
        }
        case "re-probe":
          startProbe();
          result = { ok: true, message: "probe restarted", moduleCount: moduleIds.size };
          break;
        case "diagnose-modules": {
          // Walk webpack registry and dump signatures of any module whose
          // exported names contain Group/Label/Wid/Participant. Use this when
          // a module shows OPSİYONEL to discover the new shape and update
          // MATCHERS accordingly.
          const require = captureWebpackRequire ? captureWebpackRequire() : null;
          const found = [];
          if (require && require.m) {
            const keywordsRe = /(Group|Label|Wid|Participant|Membership)/i;
            for (const id of Object.keys(require.m)) {
              let mod;
              try { mod = require(id); } catch { continue; }
              if (!mod) continue;
              for (const cand of [mod, mod.default]) {
                if (!cand) continue;
                const keys = (() => { try { return Object.keys(cand); } catch { return []; } })();
                if (!keys.length) continue;
                const matchedKeys = keys.filter((k) => keywordsRe.test(k));
                if (!matchedKeys.length) continue;
                const desc = matchedKeys.slice(0, 6).map((k) => {
                  let v;
                  try { v = cand[k]; } catch { return k + "(throws)"; }
                  if (typeof v === "function") return `${k}()`;
                  if (v && typeof v === "object") {
                    const vk = (() => { try { return Object.keys(v).slice(0, 4).join(","); } catch { return "?"; } })();
                    return `${k}{${vk}}`;
                  }
                  return `${k}=${typeof v}`;
                });
                found.push({ id: String(id).slice(0, 80), keys: desc });
                if (found.length >= 50) break;
              }
              if (found.length >= 50) break;
            }
          }
          result = { ok: true, count: found.length, modules: found, store: probeModules() };
          break;
        }
        case "list-chats": {
          if (!window.Store || !window.Store.Chat || typeof window.Store.Chat.getModelsArray !== "function") {
            throw new Error("Store.Chat not ready");
          }
          const chats = window.Store.Chat.getModelsArray();
          result = chats.map((c) => safeChatRecord(c));
          break;
        }
        case "list-contacts": {
          if (!window.Store || !window.Store.Contact || typeof window.Store.Contact.getModelsArray !== "function") {
            throw new Error("Store.Contact not ready");
          }
          const contacts = window.Store.Contact.getModelsArray();
          result = contacts.map((c) => safeContactRecord(c));
          break;
        }
        case "list-labels": {
          if (!window.Store || !window.Store.Label || typeof window.Store.Label.getModelsArray !== "function") {
            throw new Error("Store.Label not ready");
          }
          const labels = window.Store.Label.getModelsArray();
          // For each label, collect chat IDs that carry it. LabelAssociation
          // is optional; if absent, fall back to scanning chats for c.labels.
          const assoc = window.Store.LabelAssociation;
          const labelToChatIds = new Map();
          if (assoc && typeof assoc.getModelsArray === "function") {
            for (const a of assoc.getModelsArray()) {
              try {
                const labelId = a.labelId ?? a.id?.label ?? a.parentId;
                const chatId = a.chatId?._serialized || a.parentId || a.associationId?._serialized || null;
                if (labelId == null || !chatId) continue;
                if (!labelToChatIds.has(labelId)) labelToChatIds.set(labelId, []);
                labelToChatIds.get(labelId).push(chatId);
              } catch {}
            }
          } else if (window.Store.Chat && typeof window.Store.Chat.getModelsArray === "function") {
            for (const c of window.Store.Chat.getModelsArray()) {
              let arr;
              try { arr = c.labels; } catch {}
              if (!arr) continue;
              const ids = Array.isArray(arr) ? arr : (typeof arr.getModelsArray === "function" ? arr.getModelsArray() : []);
              const chatId = c.id?._serialized;
              if (!chatId) continue;
              for (const lab of ids) {
                const labelId = lab?.id ?? lab;
                if (labelId == null) continue;
                if (!labelToChatIds.has(labelId)) labelToChatIds.set(labelId, []);
                labelToChatIds.get(labelId).push(chatId);
              }
            }
          }
          result = labels.map((l) => safeLabelRecord(l, labelToChatIds.get(l.id) || []));
          break;
        }
        case "subscribe-new-messages": {
          // Hook Store.Msg.on('add', ...) and forward each new INCOMING
          // message to the ISOLATED world via window.postMessage. Idempotent.
          if (!window.Store || !window.Store.Msg) {
            // Try to find Msg collection from webpack now if not present
            // (it's not in our REQUIRED set; resolve lazily here).
            try {
              const cap = captureWebpackRequire ? captureWebpackRequire() : null;
              if (cap && cap.m) {
                for (const id of Object.keys(cap.m)) {
                  let mod; try { mod = cap(id); } catch { continue; }
                  if (mod && mod.Msg && typeof mod.Msg.on === "function" && typeof mod.Msg.getModelsArray === "function") {
                    window.Store.Msg = mod.Msg;
                    break;
                  }
                  if (mod && mod.default && mod.default.Msg && typeof mod.default.Msg.on === "function") {
                    window.Store.Msg = mod.default.Msg;
                    break;
                  }
                }
              }
            } catch {}
          }
          if (!window.Store || !window.Store.Msg || typeof window.Store.Msg.on !== "function") {
            throw new Error("Store.Msg not available — Mesaj dinleme bu sürümde desteklenmiyor.");
          }
          if (!window.__waExporterMsgListener) {
            window.__waExporterMsgListener = (m) => {
              try {
                if (m.fromMe) return;
                if (m.isStatusV3 || m.isStatus) return;
                const chatId = (m.id && m.id.remote && m.id.remote._serialized) || (m.from && m.from._serialized) || null;
                let chatName = chatId;
                let chat = null;
                try { chat = chatId ? window.Store.Chat.get(chatId) : null; } catch {}
                if (chat) chatName = chat.formattedTitle || chat.name || (chat.contact && chat.contact.name) || chatId;
                const rec = safeMessageRecord(m, chatId, chatName);
                window.postMessage({ source: SOURCE, type: "WA_NEW_MSG", data: rec }, window.location.origin);
              } catch {}
            };
            try {
              window.Store.Msg.on("add", window.__waExporterMsgListener);
            } catch (err) {
              throw new Error("Store.Msg.on('add') başarısız: " + (err.message || err));
            }
          }
          result = { ok: true, subscribed: true };
          break;
        }
        case "unsubscribe-new-messages": {
          try {
            if (window.__waExporterMsgListener && window.Store?.Msg?.off) {
              window.Store.Msg.off("add", window.__waExporterMsgListener);
            }
          } catch {}
          window.__waExporterMsgListener = null;
          result = { ok: true };
          break;
        }
        case "send-text-message": {
          const { chatId, body } = data.payload || {};
          if (!chatId || !body) throw new Error("chatId ve body zorunlu");
          if (!window.Store?.Chat) throw new Error("Store.Chat not ready");
          const chat = window.Store.Chat.get(chatId);
          if (!chat) throw new Error("Sohbet bulunamadı: " + chatId);
          let sent = false;
          // Try multiple known send paths because the API name varies.
          if (typeof chat.sendMessage === "function") {
            try { await safeAwait(chat.sendMessage(body)); sent = true; } catch {}
          }
          if (!sent && window.Store.SendTextMsgToChat) {
            try { await safeAwait(window.Store.SendTextMsgToChat(chat, body)); sent = true; } catch {}
          }
          if (!sent && window.Store.Wap && typeof window.Store.Wap.sendChatStateComposing === "function") {
            // No usable send fn in this build
          }
          if (!sent) throw new Error("Bu WA Web sürümünde mesaj gönderme API'si bulunamadı.");
          result = { ok: true };
          break;
        }
        case "list-messages": {
          if (!window.Store || !window.Store.Chat || typeof window.Store.Chat.getModelsArray !== "function") {
            throw new Error("Store.Chat not ready");
          }
          const payload = data.payload || {};
          const perChatLimit = Math.max(10, Math.min(5000, payload.perChatLimit || 500));
          const loadEarlierBatches = Math.max(0, Math.min(20, payload.loadEarlierBatches || 0));
          const chatIdFilter = Array.isArray(payload.chatIds) ? new Set(payload.chatIds) : null;

          const all = window.Store.Chat.getModelsArray();
          const targets = chatIdFilter ? all.filter((c) => chatIdFilter.has(c.id?._serialized)) : all;

          const out = [];
          // Diagnostic counters surfaced back to popup so user knows what worked.
          const diag = {
            totalChats: targets.length,
            chatsWithMsgs: 0,
            chatsLoaded: 0,
            chatsZero: 0,
            loadStrategy: { loadEarlierMsgs: 0, loadAroundMsgs: 0, MsgsHelper: 0, fetchBefore: 0, none: 0 },
            msgSource: { getModelsArray: 0, _models: 0, messages: 0, lastMessage: 0, none: 0 },
          };

          for (const chat of targets) {
            const chatId = chat.id?._serialized || null;
            const chatName = chat.formattedTitle || chat.name || (chat.contact && chat.contact.name) || chatId;

            // ---- Strategy A: try to grow the in-memory window ----
            if (loadEarlierBatches > 0) {
              for (let i = 0; i < loadEarlierBatches; i++) {
                let progressed = false;
                try {
                  if (typeof chat.loadEarlierMsgs === "function") {
                    await safeAwait(chat.loadEarlierMsgs());
                    diag.loadStrategy.loadEarlierMsgs++;
                    progressed = true;
                  } else if (typeof chat.loadAroundMsgs === "function") {
                    await safeAwait(chat.loadAroundMsgs());
                    diag.loadStrategy.loadAroundMsgs++;
                    progressed = true;
                  } else if (window.Store.MsgsHelper) {
                    const mh = window.Store.MsgsHelper;
                    if (typeof mh.loadEarlierMsgs === "function") {
                      await safeAwait(mh.loadEarlierMsgs(chat));
                      diag.loadStrategy.MsgsHelper++;
                      progressed = true;
                    } else if (typeof mh.getEarlierMsgs === "function") {
                      await safeAwait(mh.getEarlierMsgs(chat, 50));
                      diag.loadStrategy.MsgsHelper++;
                      progressed = true;
                    }
                  } else if (chat.msgs && typeof chat.msgs.fetchMessagesBeforeMsg === "function") {
                    const oldest = chat.msgs.getModelsArray ? chat.msgs.getModelsArray()[0] : null;
                    if (oldest && oldest.id) {
                      await safeAwait(chat.msgs.fetchMessagesBeforeMsg(oldest.id, 50));
                      diag.loadStrategy.fetchBefore++;
                      progressed = true;
                    }
                  }
                } catch {}
                if (!progressed) { diag.loadStrategy.none++; break; }
              }
            }

            // ---- Strategy B: pull whatever messages are now in memory ----
            let msgs = [];
            let source = "none";
            try {
              const msgColl = chat.msgs;
              if (msgColl && typeof msgColl.getModelsArray === "function") {
                msgs = msgColl.getModelsArray();
                if (msgs.length) source = "getModelsArray";
              }
              if (!msgs.length && msgColl && Array.isArray(msgColl._models)) {
                msgs = msgColl._models;
                if (msgs.length) source = "_models";
              }
              if (!msgs.length && Array.isArray(chat.messages)) {
                msgs = chat.messages;
                if (msgs.length) source = "messages";
              }
            } catch {}

            // ---- Strategy C: if still empty, fall back to lastMessage ----
            if (msgs.length === 0) {
              try {
                const lm = chat.lastMessage || (chat.msgs && chat.msgs.last && chat.msgs.last());
                if (lm) { msgs = [lm]; source = "lastMessage"; }
              } catch {}
            }

            diag.msgSource[source] = (diag.msgSource[source] || 0) + 1;
            if (msgs.length === 0) diag.chatsZero++;
            else diag.chatsWithMsgs++;

            const sliced = msgs.slice(-perChatLimit);
            for (const m of sliced) out.push(safeMessageRecord(m, chatId, chatName));
          }

          // Log to console for power-user troubleshooting.
          console.log("[wa-exporter] list-messages diagnostics:", diag);
          // Return as object — Array.foo properties don't survive structured
          // cloning, so wrap explicitly.
          result = { messages: out, diag };
          break;
        }
        case "list-groups": {
          if (!window.Store || !window.Store.Chat || typeof window.Store.Chat.getModelsArray !== "function") {
            throw new Error("Store.Chat not ready");
          }
          const groupChats = window.Store.Chat.getModelsArray().filter((c) => {
            try { return c.isGroup || (c.id && c.id._serialized && c.id._serialized.endsWith("@g.us")); } catch { return false; }
          });
          const out = [];
          for (const g of groupChats) {
            const base = safeChatRecord(g);
            const participants = [];
            try {
              const parr = await loadGroupMetadataForChat(g);
              for (const p of parr) participants.push(safeParticipantRecord(p));
            } catch {}
            out.push({ ...base, participants });
          }
          result = out;
          break;
        }
        default:
          throw new Error(`unknown op: ${op}`);
      }
      window.postMessage({ source: SOURCE, type: MSG.WA_RES, reqId, data: result }, window.location.origin);
    } catch (err) {
      window.postMessage(
        { source: SOURCE, type: MSG.WA_ERR, reqId, error: err && err.message ? err.message : String(err) },
        window.location.origin,
      );
    }
  });
})();
