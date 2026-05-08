# Landing Page Deploy Rehberi

Statik tek-sayfa site (vanilla HTML/CSS/JS). Üç platformda da 5 dakika içinde live olur.

## 1. Vercel (önerilen — en hızlı)

```bash
# Vercel CLI ilk seferlik
npm install -g vercel

# landing/ klasörüne gel
cd landing/

# Deploy (Bluedev hesabıyla giriş yapacak)
vercel --prod
```

Veya **GitHub entegrasyonuyla** (sürekli deploy):
1. [vercel.com/new](https://vercel.com/new) → "Import Git Repository"
2. `aydogandagidir/wa-contacts-exporter` repo'sunu seç
3. Root Directory: **`landing`**
4. Framework Preset: **Other** (statik)
5. Deploy

Custom domain için: Project Settings → Domains → `bluedev.dev/products/wa-contacts-exporter` ekle.

`vercel.json` dosyası zaten hazır — cache headers + güvenlik header'ları içerir.

## 2. Netlify

```bash
# Netlify CLI ilk seferlik
npm install -g netlify-cli
netlify login

cd landing/
netlify deploy --prod --dir=.
```

Veya **GitHub entegrasyonuyla**: [app.netlify.com/start](https://app.netlify.com/start) → repo seç → Base directory: `landing` → Publish directory: `.`

## 3. GitHub Pages

```bash
# Yeni gh-pages branch'i oluştur, sadece landing/ içeriğini push et
git checkout -B gh-pages
git rm -rf .  # hot path: sadece landing/ kalsın
cp -r landing/* .
git add .
git commit -m "Deploy landing v1.0.0"
git push -u origin gh-pages

# Repo Settings → Pages → Source: gh-pages branch → /
```

URL: `https://aydogandagidir.github.io/wa-contacts-exporter/`

## 4. Cloudflare Pages

[pages.cloudflare.com](https://pages.cloudflare.com) → "Connect to Git" → repo seç → Build settings:
- Framework preset: **None**
- Build command: (boş bırak)
- Build output directory: `landing`

## bluedev.dev altında

Eğer `bluedev.dev` zaten Vercel/Netlify'de host ediliyorsa:
- Aynı projeye bu repo'yu **subpath** olarak ekle: `bluedev.dev/products/wa-contacts-exporter`
- Veya **subdomain**: `wa.bluedev.dev`

## Deploy sonrası verification checklist

- [ ] `https://your-domain/` → hero section yüklendi
- [ ] Tüm screenshot'lar broken-image değil (`landing/assets/screenshots/01-05.png`)
- [ ] Demo video oynatılıyor (`landing/assets/demo.mp4`)
- [ ] TR/EN dil switcher çalışıyor (sağ üst pill)
- [ ] `privacy.html` açılıyor (footer'daki "Aydınlatma Metni" linki)
- [ ] Mobile responsive (DevTools → device mode → 375px)
- [ ] Open Graph preview Twitter/LinkedIn'de doğru görünüyor:
  - [opengraph.xyz](https://www.opengraph.xyz/) ile test et

## CWS submission için bu URL gerekli

CWS form'unda **Privacy practices URL** zorunlu — landing yayınlandıktan sonra:

```
https://your-domain/privacy.html
```

URL'i not al, [docs/store-listing-tr.md](../docs/store-listing-tr.md) ve [docs/store-listing-en.md](../docs/store-listing-en.md) içine yaz.
