# Test Plan — WA Contacts Exporter

Manuel kabul testleri. v0.1.0 release öncesi tüm 15 senaryo PASS olmalı.

## Test ortamı

- **Tarayıcı:** Chrome 111+ (MV3 + world:MAIN content_script desteği için)
- **WhatsApp Web sürümü:** 2.3000.x veya üstü
- **OS:** Windows 11 / macOS 14+ / Ubuntu 22+
- **Locale:** Türkçe karakterleri doğrulamak için en az bir TR sohbet
- **Excel:** Microsoft Excel TR (CSV/XLSX karakter testi için)
- **VCard reader:** Google Contacts veya Apple Contacts

## Pre-test setup

1. `npm run build` ile `dist/` üret
2. `chrome://extensions` → Geliştirici modu → "Paketlenmemiş öğe yükle" → `dist/`
3. WhatsApp Web'i aç, QR ile giriş yap, sohbet listesi tamamen yüklensin
4. Popup'ı aç → KVKK rıza ekranı → kabul et
5. Yeşil dot + en az `Chat` modülü ✓ olmalı

## 5 chat type × 3 format = 15 test senaryosu

Her senaryoda preview tablosu doğru görünmeli + dosya indirilebilmeli + içeriği doğru olmalı.

| # | Chat Tipi                       | Format | Beklenen Sonuç |
|---|---------------------------------|--------|----------------|
| 1 | 1-on-1 saved (kayıtlı kişi)     | CSV    | name = saved contact name; phone = +9...; is_saved_contact = true; Excel TR'de TR karakterler doğru |
| 2 | 1-on-1 saved                    | XLSX   | "Sohbetler" sayfasında satır var; bold header; freeze top row aktif |
| 3 | 1-on-1 saved                    | VCard  | BEGIN:VCARD ... FN:isim ... TEL;TYPE=CELL:+90... NOTE:WhatsApp 1-on-1 ... END:VCARD |
| 4 | 1-on-1 unsaved (sadece numara)  | CSV    | "Kayıtlı olmayan kişileri dahil et" KAPALI iken: satır YOK. AÇIK iken: name = +90 555..., is_saved_contact = false |
| 5 | 1-on-1 unsaved                  | XLSX   | Toggle'a göre satır görünür/gizli |
| 6 | 1-on-1 unsaved                  | VCard  | Toggle'a göre BEGIN:VCARD bloğu var/yok |
| 7 | Küçük grup (≤5 üye)             | CSV    | Sohbetler sekmesi: group_name dolu; Gruplar sekmesi CSV: 1 grup başlık satırı + ≤5 member satırı (is_group_member=true) |
| 8 | Küçük grup                      | XLSX   | "Gruplar" sayfasında grup başlığı + member satırları |
| 9 | Küçük grup                      | VCard  | Her saved member için bir BEGIN:VCARD bloğu (NOTE'ta group= ve admin=true varsa) |
| 10| Büyük grup (>50 üye)            | CSV    | Performans: extraction <30s; toplam member sayısı doğru |
| 11| Büyük grup                      | XLSX   | Sayfa açılırken Excel donmamalı; tüm satırlar yazılmış olmalı |
| 12| Büyük grup                      | VCard  | Tüm benzersiz telefon numaraları için VCard blokları |
| 13| Etiketli sohbet (WA Business)   | CSV    | Etiketler sekmesi CSV'sinde label_name, color, chat_count, chat_ids dolu |
| 14| Etiketli sohbet                 | XLSX   | "Etiketler" sayfasında her label bir satır; chat_ids ; ile ayrılmış |
| 15| Etiketli sohbet                 | VCard  | (Etiket VCard'ı yok — N/A. Etiket eşleşmeleri Tüm Kişiler VCard'ında not olarak görünmüyor — gelecek sürümde) |

## Diğer kabul testleri

### KVKK consent gate
- [ ] **K1:** Eklentiyi yeni yükle (chrome.storage temiz) → popup açılınca **sadece consent ekranı** görünmeli, hiçbir tab veri çıkaramamalı
- [ ] **K2:** Checkbox işaretsiz iken "Onaylıyorum" butonu **disabled** olmalı
- [ ] **K3:** "Aydınlatma metni" linki yeni tab'da TR aydınlatma sayfasını açmalı (KVKK 7 madde içermeli)
- [ ] **K4:** Onay sonrası popup'ı kapat-aç → consent ekranı **bir daha çıkmamalı**, normal arayüz açılmalı
- [ ] **K5:** Footer "Aydınlatma metni" linki çalışmalı (consent sonrası)

### Hata kurtarma
- [ ] **E1:** WA Web sekmesi YOK iken popup aç → "WhatsApp Web sekmesi bulunamadı" hatası, tabs gizli
- [ ] **E2:** WA Web hazır olmadan popup aç → "Modüller yükleniyor…" mesajı, Yenile butonu çalışır
- [ ] **E3:** Devtools'ta `delete window.Store.Chat` → Sohbetleri Çıkar → "Hata: Store.Chat not ready" + Hata raporu kopyala'da scope=extract-chats görünür
- [ ] **E4:** Eklentiyi reload + WA Web tab'ı yenilenmeden popup aç → content script "Extension context invalidated" hatası SESSİZCE yakalanmalı (console'da fırlatılan hata YOK)
- [ ] **E5:** "Hata raporu kopyala" → panoda valid JSON: { generatedAt, version, lastHealth, lastError, log: [] }

### Persistence
- [ ] **P1:** "Kayıtlı olmayan kişileri dahil et" işaretle → popup kapat-aç → işaret hâlâ aktif (chrome.storage.local'da `wa_settings.includeUnsaved=true`)
- [ ] **P2:** Hata oluştur (E3) → popup kapat-aç → Hata raporu kopyala → log dizisi son hatayı içerir (kalıcı)
- [ ] **P3:** Sohbetler sekmesinde toggle'ı kapat → Tüm Kişiler sekmesine geç → toggle KAPALI olmalı (sync)

### Build pipeline
- [ ] **B1:** `npm run build` warning/error'suz tamamlanır
- [ ] **B2:** `dist/manifest.json` `world: "MAIN"` içerir, content_scripts iki adettir (inject.js + content.js)
- [ ] **B3:** `dist/assets/` içinde `xlsx-*.js` chunk **var** ve >100 KB (SheetJS code-split kanıtı)
- [ ] **B4:** `dist/assets/popup.html-*.js` <50 KB (XLSX bundle'a girmemiş)
- [ ] **B5:** `npm run package` → `wa-contacts-exporter-0.1.0.zip` üretir; içeriği `dist/`'in aynısı

## Smoke check (her commit sonrası)

```bash
npm run build    # PASS olmalı
```

`chrome://extensions` → Errors → **boş** olmalı (eski hatalar Clear all ile silinebilir).

## Performans hedefleri

- Sağlık probu: < 15 saniye (büyük çoğunlukta < 5s)
- Sohbetleri çıkar (~200 chat): < 2 saniye
- Grupları çıkar (10 grup, ortalama 30 üye): < 10 saniye
- XLSX build (~500 row): < 3 saniye
- VCard build (~500 contact): < 1 saniye

## Regresyon — bilinen sorunlar değişmedi mi?

- [ ] GroupMetadata "OPSİYONEL" badge'i hâlâ görünüyor (beklendik)
- [ ] LabelAssociation "OPSİYONEL" badge'i hâlâ görünüyor (beklendik)
- [ ] CSV'de Türkçe karakterler ş ğ ü ö ç İ doğru render olmalı (UTF-8 BOM)
- [ ] tarih formatı `2026-05-05 13:48:36` (T/Z yok) Excel TR'de datetime olarak parse edilmeli
