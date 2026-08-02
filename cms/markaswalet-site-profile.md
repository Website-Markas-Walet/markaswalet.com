# Siapa Saya — markaswalet.com (kondisi aktual, untuk app.markaswalet.id)

> Ditulis dari sudut pandang **situs markaswalet.com sendiri**, apa adanya.
> Tujuannya bukan menyuruh kalian pakai teknologi tertentu — tapi supaya **CMS kalian menyesuaikan realitas saya**. Saya sengaja **tidak menyebut framework** apa pun; itu keputusan kalian setelah paham kondisi saya.

---

## 1. Identitas hosting

- Saya di-hosting di **Cloudflare Pages**, disajikan dari repo GitHub `rahma.markaswalet.id`. **File statis di root repo = isi situs saya.**
- **Deploy = git push ke `main` → Cloudflare rebuild otomatis.** Tidak ada tombol "publish" lain.
- Domain `markaswalet.com` dikelola di **Cloudflare Akun #1** (khusus markaswalet). 11 situs jaringan lain ada di **Cloudflare Akun #2** — jadi kredensial/deploy-hook saya **beda akun** dari mereka.
- Saya punya **`_headers`** (aturan cache) dan **`functions/api/`** = **Cloudflare Pages Functions** (`create-invoice.js`, `xendit-webhook.js` untuk pembayaran Xendit). Artinya saya **tidak 100% statis** — ada lapisan serverless edge untuk hal tertentu (pembayaran).
- Build command saat ini praktis kosong (saya disajikan sebagai HTML statis apa adanya).

## 2. Saya ini sebenarnya apa

- Saya adalah **hasil export statis dari situs WordPress + Elementor**. **WordPress asalnya sudah tidak ada** — export statis ini satu-satunya wujud saya yang tersisa.
- **Konten saya "dipanggang" ke dalam file HTML.** Saya **tidak punya database, tidak punya CMS** sendiri. Tiap halaman = satu folder berisi `index.html` (URL bergaya direktori).
- Saya masih membawa **seluruh beban WordPress/Elementor**: ±**40 file CSS + 51 script per halaman**. Itu sebabnya saya berat.
- (Konteks: ada upaya menulis-ulang saya jadi lebih ringan di subfolder terpisah, **belum live**. Framework-nya masih terbuka — jangan jadikan itu asumsi.)

## 3. Keterbatasan yang harus diterima CMS

- **Saya tidak punya database & server konten sendiri.** Konten saya = file datar. (Pages Functions ada, tapi untuk hal spesifik seperti pembayaran — bukan menyajikan artikel dari DB.)
- Karena itu, hubungan CMS→saya paling wajar bersifat **saat build / saat deploy**, bukan API-per-request. Untuk ubah konten, file saya harus **di-generate ulang & di-deploy** (git push → Cloudflare rebuild). Kalau mau bagian dinamis, jalurnya lewat **Pages Functions**.
- **URL direktori saya wajib dipertahankan** (SEO & backlink). Jangan ubah pola `/slug/`.
- Saya **multibahasa/multi-wilayah** (lihat §4) — model konten harus menampung terjemahan/varian + **hreflang**.
- Beberapa halaman saya adalah **funnel pemasaran dengan pembayaran** (LP + Xendit) — Functions itu harus tetap hidup.
- **Media saya besar & ikut di repo** (lihat §7) — idealnya dikeluarkan.

## 4. Peta URL (kondisi nyata)

Total **±1.341 halaman `index.html`**. Kelompok utama:

| Pola URL | Isi | Jumlah |
|---|---|---|
| `/` | Homepage (bahasa Inggris) | 1 |
| `/article/<slug>/` | Artikel | **262** |
| `/category/.../` + `/page/N/` | Halaman kategori & paginasi | 25 |
| `/premium-birdnest-product/`, `/markaswalet-apps/`, `/cultivation-technology/`, `/swiftlet-house-construction/`, `/farming-products/`, `/our-product/`, `/nestcosystem/`, `/manufacture-and-export/`, `/information-center/`, `/about-us/`, `/edible-birds-nest-cleaning/` | Halaman produk/landing bespoke | ~12 |
| `/lp_matawalet_pro[_b/_c]/`, `/lp_matawalet_trial[...]/`, `/lp_parfum/`, `/lp_seminar/`, `/lp_tweeter_walet/`, `/parfumwalet1..4/` | Landing page kampanye (sebagian + pembayaran) | ~48 |
| `/id/...` | **Varian bahasa Indonesia** (`lang=id-ID`) — menerjemahkan artikel & halaman | 246 |
| `/banjarbaru/...` | **Varian wilayah** (edisi Banjarbaru, `lang=en-US`) | 160 |
| `/MRS/`, `/2/`,`/3/`.., `/author/`, `/comments/`, `/feed/`, `/checkout/` | Varian kecil, paginasi, utilitas | sisanya |

Catatan: `id/article/<slug>` = **terjemahan** dari `article/<slug>` (slug sama, konten beda bahasa). hreflang sudah dipasang.

## 5. Chrome bersama yang sekarang terduplikasi

- **Header** (logo ganda PT Lentera Alam Nusantara + Markas Walet, menu "Home / Our Product▾ / Article / About Us") dan **footer** (4 kolom: profil, 2 alamat, Our Product, ikon sosial, badge Google Play) **disalin utuh ke dalam SETIAP halaman** — ±**368 halaman** membawa header, ±**366** membawa footer.
- Konsekuensinya: **ganti 1 item menu = harus edit ratusan file.** Ini pemborosan & rawan tidak konsisten.
- Yang saya butuhkan: chrome diperlakukan sebagai **SATU template bersama**, bukan konten per-halaman. CMS cukup mengurus **isi**, bukan header/footer yang berulang.

## 6. Tipe konten yang benar-benar saya punya

1. **Artikel (262)** — template seragam: `judul, isi (body), gambar unggulan, kategori, tag, penulis, tanggal`; sebagian punya **video YouTube**. Ada versi terjemahan (`id/`).
2. **Halaman kategori/daftar (25)** — daftar artikel + paginasi (turunan otomatis dari artikel).
3. **Halaman bespoke** — homepage + halaman produk/landing (Premium Birdnest, Apps, Cultivation Tech, Construction, Farming Products, About, Information Center, dll). Layout kaya: hero, slider, flip-box, banyak section. **Bukan** template seragam.
4. **Landing page kampanye (LP)** — funnel pemasaran; sebagian dengan **pembayaran Xendit** (MataWalet PRO/trial), varian parfum.
5. **Varian bahasa/wilayah** — Inggris (root), **Indonesia** (`/id/`), **Banjarbaru** (edisi wilayah).

> Ringkas untuk model data: **artikel + kategori = massal & seragam** (paling banyak, paling cocok dikelola CMS). **Bespoke + LP = khusus** (lebih jarang berubah; sebagian butuh Functions).

## 7. Kondisi media

- **2.683 file gambar, ±389 MB**, semuanya di **`/wp-content/uploads/` DI DALAM repo** (media ikut di-commit ke git → repo jadi berat).
- Format: **PNG 1.330 · JPG 1.212 · JPEG 121 · WebP 20** (WebP masih sangat sedikit).
- Banyak **varian ukuran bawaan WordPress** (`-300x273`, `-768x…`, `-1024x…`, `-scaled`, `-2048x…`) untuk tiap gambar.
- Dirujuk dengan **URL root-relative** (`/wp-content/uploads/...`), disajikan dari domain saya sendiri — **belum ada CDN/storage media terpisah**.
- Sudah pernah dikompres (dari 942MB → 389MB), tapi tetap berat & bercampur dengan file situs.

## 8. Intinya untuk kalian (app.markaswalet.id)

Saya adalah **situs konten statis berbasis file, multibahasa, di Cloudflare** — **tanpa DB/CMS sendiri**; konten saya dipanggang ke file dan diperbarui lewat **rebuild + deploy**.

Kalau kalian jadi CMS saya, tolong rancang menyesuaikan realitas ini:
- **Antar konten saat build/deploy** (saya regenerasi tiap deploy), bukan mengandalkan saya query DB per-request.
- **Pertahankan URL direktori** saya + **varian bahasa/wilayah + hreflang**.
- **Perlakukan header/footer sebagai satu template bersama** — hentikan duplikasi.
- Sadari **tipe konten** saya: *artikel + kategori* (massal/seragam) vs *bespoke + LP* (khusus, sebagian butuh Functions).
- **Keluarkan media saya dari repo** ke storage yang benar (referensi via URL), idealnya dengan optimasi otomatis.
- **Jaga Pages Functions saya** (Xendit) tetap hidup, dan ingat **saya di akun Cloudflare #1** (beda dari 11 situs lain).

Framework/tekniknya **kalian yang tentukan** — yang penting cocok dengan kondisi saya di atas.
