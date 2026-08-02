# Balasan — markaswalet.com (persiapan integrasi CMS)

> Dari **session markaswalet.com** untuk CMS terpusat. Scope aditif dipahami: CMS commit KONTEN ke repo, chrome/menu/URL saya tidak diubah. ✅

---

## 🔴 BLOCKER #1 — Mekanisme deploy (KONFIRMASI)

| | |
|---|---|
| **Host** | **Cloudflare Pages** |
| **Repo** | `github.com/Website-Markas-Walet/markaswalet.com` |
| **Branch produksi** | `main` |
| **Cara repo → live** | **Auto-deploy**: push ke `main` → Cloudflare Pages build & publish otomatis |
| **Akun Cloudflare** | **Akun #1** (markaswalet) |
| **Deploy Hook** | *Belum dikonfirmasi ada.* **Tapi tidak wajib** — karena commit ke `main` sudah memicu rebuild otomatis. Jadi target tombol "Publish" = **commit ke `main`** (lihat Blocker #2). Deploy Hook hanya perlu kalau ingin trigger rebuild TANPA commit — bisa dibuatkan di dashboard bila diminta. |

➡️ **Target "Publish" = commit ke branch `main`.** Cloudflare urus sisanya.

## 🔴 BLOCKER #2 — Akses tulis untuk CMS

CMS menulis dengan **commit ke repo GitHub** `Website-Markas-Walet/markaswalet.com` (branch `main`).

Mekanisme yang disarankan (pilih satu, dibuat oleh pemilik repo — **jangan kirim token di chat**):
1. **GitHub App** (paling rapi) — install ke repo ini, permission `contents: write`. Terscoped & bisa dicabut.
2. **Fine-grained PAT** — scope `contents: write` khusus repo ini.
3. **Deploy key (SSH)** dengan akses tulis.

Commit ke `main` → Cloudflare auto-deploy (Blocker #1). **Tidak perlu Deploy Hook terpisah.**

---

## ✅ Deliverable yang SUDAH siap (menyusul dari brief)

### 3. Chrome template → **terlampir: `markaswalet-layout-template.html`**
- Header (logo ganda + menu "Home / Our Product▾ / Article / About Us") + footer 4-kolom (profil, 2 alamat, Our Product, sosial, Google Play).
- Penanda slot **`<!-- CONTENT -->`** + token `{{TITLE}} {{META_DESCRIPTION}} {{CANONICAL}} {{LANG}} {{HREFLANG_LINKS}} {{OG_IMAGE}} {{CONTENT}}`.
- Sudah termasuk **GTM-WX5D42HV**.
- ⚠️ Ini chrome **BERSIH** (bukan Elementor) — halaman baru dari CMS jadi ringan & tampil sama; **halaman lama tak disentuh** (aditif). Kalau kalian justru mau chrome **byte-identik** dengan yang lama (Elementor), bilang — saya bisa ekstrak versi itu.

### 4. url_patterns (dengan keanehan)
| Tipe | Pola | Catatan |
|---|---|---|
| Artikel | `/article/<slug>/` | folder + **trailing slash** (bukan `.html`) |
| Artikel (ID) | `/id/article/<slug>/` | terjemahan, slug SAMA |
| Kategori | `/category/<cat>/` + `/page/N/` | paginasi |
| Halaman bespoke | `/premium-birdnest-product/`, `/about-us/`, dst | folder + trailing slash |
| LP kampanye | `/lp_*/`, `/parfumwalet1..4/` | **hand-coded, jangan digenerate CMS** |
| Varian locale | root=EN · `/id/`=ID · `/banjarbaru/`=wilayah | |
- Keanehan: **semua direktori (tanpa .html) + trailing slash**; paginasi `/2/`, `/3/`.

### 5. Config situs
- **Analytics:** container live = **`GTM-WX5D42HV`**. (GA4 `G-0PB19GXJ5J` terlihat termuat — ⚠️ ada **decoy** GTM/GA4 di aset; konfirmasi mana yang benar-benar live dengan tim analytics sebelum dipakai.)
- **Brand:** emas `#f4b41a`, hijau `#0a7d4b` / gelap header `#0b241d`; font **Poppins**; logo putih `cropped-logo-website-white-291x45.png`, logo warna `fix_logo_colour.png`; favicon `intellectual-150x150.png`.
- **Menu:** Home / Our Product (5: Premium Birdnest, Apps, Cultivation Tech, Farming Products, Construction) / Article / About Us.
- **Kontak:** alamat HQ (Gubeng Kertajaya 5D No 20, Surabaya) + Marketing (Dharmawangsa 33, Inkubator Bisnis UNAIR). **WA/email belum ketemu di homepage** — akan saya ambil dari halaman kontak/produk (menyusul).
- **Menu jaringan/ekosistem:** ada di `/information-center/` (daftar 13 situs) — kandidat kontrol pusat.

### 6. Ekspor konten — **sebagian SUDAH ada**
- **231 artikel sudah diekstrak ke Markdown terstruktur** (title, slug, body, meta desc, tanggal, cover image, video) dari kerja migrasi sebelumnya. Bisa saya konversi ke format CMS (JSON + body HTML) begitu skema `articles` final.
- Artikel punya **versi EN + ID** (slug sama, `/id/`). Struktur terjemahan = §addendum di bawah.
- **Tidak ada dataset kota** untuk markaswalet (itu untuk situs SEO jaringan spt sarangwalet). Markaswalet: artikel + bespoke + LP.

### 7. Inventaris media
- **2.683 gambar lokal, ±389MB** di `/wp-content/uploads/` (root-relative) → siap **rehome ke R2**.
- Hotlink eksternal: markaswalet **mayoritas lokal** (beda dari situs jaringan yg banyak blogspot/hatena). Saya bisa generate daftar lengkap lokal + tandai hotlink begitu diminta.

### 8. URL/slug
- **Tidak akan diubah.** Kalau nanti ada perubahan, saya siapkan peta **301**. (Belum ada rencana ubah — scope aditif.)

---

## 📌 Addendum khusus markaswalet.com (jawaban)

- **Multibahasa (EN/ID/Banjarbaru) + hreflang** ✅
  Struktur terjemahan: **slug sama, prefix locale** — `/{slug}/` (EN) ↔ `/id/{slug}/` (ID) ↔ `/banjarbaru/{slug}/` (wilayah, EN). hreflang aktif: `en-US`→`/`, `id-ID`→`/id/`. CMS perlu dimensi **`locale`** + link antar-terjemahan.
- **`functions/` (Xendit)** — ✅ **JAGA, jangan disentuh.** CMS commit hanya konten (artikel/halaman), **jangan** ke `functions/`. Saya tak akan ubah.
- **⚠️ Xendit masih error** — diperbaiki di **track terpisah** (bukan bagian integrasi CMS ini).
- **LP bespoke** (MataWalet PRO/trial, parfum) — **tetap hand-coded**, di luar cakupan generate CMS.
- **Cloudflare Akun #1** — ✅ dikonfirmasi.

---

## Ringkas untuk CMS
1. Publish = **commit ke `main`** repo `Website-Markas-Walet/markaswalet.com` → Cloudflare auto-deploy (Akun #1).
2. Akses tulis = **GitHub App / PAT contents:write** (pemilik repo siapkan, bukan di chat).
3. Chrome template + url_patterns + config + struktur terjemahan → **terlampir/di atas**.
4. 231 artikel siap diekspor; media siap di-list untuk R2; `functions/` & LP **jangan disentuh**.
