/**
 * Cloudflare Pages Function — membuat invoice Xendit untuk Pre-Order MataWalet PRO.
 *
 * Endpoint: POST /api/create-invoice
 *
 * Secret key TIDAK PERNAH masuk repo. Set di:
 *   Cloudflare Pages → Settings → Environment variables → XENDIT_SECRET_KEY (encrypted)
 * Pakai key Mode Test dulu (xnd_development_...), ganti ke xnd_production_... saat live.
 *
 * Harga dihitung di sini, bukan dikirim dari browser — kalau amount dipercayakan ke
 * client, siapa pun bisa ubah jadi Rp 1.000 lewat devtools.
 */

const HARGA_UNIT = 1500000; // Rp / unit — sinkron dengan lp_matawalet_pro/index.html
const MAX_QTY = 5; // samakan dengan pilihan di checkout/checkout.js
const WA_ADMIN = "6285235350662";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function onRequestPost({ request, env }) {
  if (!env.XENDIT_SECRET_KEY) {
    // Jangan bocorkan detail ke pengunjung, tapi tetap jelas di log.
    console.error("XENDIT_SECRET_KEY belum di-set di environment variables");
    return json({ error: "Pembayaran belum aktif. Silakan hubungi kami via WhatsApp." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Format permintaan tidak valid." }, 400);
  }

  const nama = String(body.nama || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\s|-/g, "");
  const qty = Math.min(Math.max(parseInt(body.qty, 10) || 1, 1), MAX_QTY);
  const bayar = body.bayar === "dp" ? "dp" : "lunas";
  // Varian LP asal — dipakai untuk membandingkan konversi A/B/C di dashboard.
  // Dibatasi ke daftar tetap; kalau tidak dikenali, tandai "lain".
  const VARIAN = {
    "/lp_matawalet_pro/": "lp-a-conversion",
    "/lp_matawalet_pro_b/": "lp-b-awareness",
    "/lp_matawalet_pro_c/": "lp-c-consideration",
  };
  const sumber = VARIAN[String(body.sumber || "").replace(/index\.html$/, "")] || "lain";

  if (nama.length < 3) return json({ error: "Nama lengkap wajib diisi." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "Email tidak valid." }, 400);
  if (!/^(\+?62|0)8\d{7,12}$/.test(phone)) return json({ error: "Nomor WhatsApp tidak valid." }, 400);

  const total = HARGA_UNIT * qty;
  const amount = bayar === "dp" ? Math.round(total / 2) : total;
  const label = bayar === "dp" ? `DP 50% dari ${qty} unit` : `Lunas ${qty} unit`;

  // external_id harus unik. Timestamp + acak sudah cukup untuk volume pre-order.
  // Varian LP ikut disisipkan supaya terbaca langsung di kolom External ID.
  const externalId = `matawalet-${sumber}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const payload = {
    external_id: externalId,
    amount,
    currency: "IDR",
    payer_email: email,
    description: `Pre-Order MataWalet PRO — ${label}`,
    customer: {
      given_names: nama,
      email,
      mobile_number: phone.startsWith("0") ? "+62" + phone.slice(1) : phone,
    },
    customer_notification_preference: {
      invoice_created: ["email", "whatsapp"],
      invoice_reminder: ["email", "whatsapp"],
      invoice_paid: ["email", "whatsapp"],
    },
    items: [
      {
        name: "MataWalet PRO — AI IoT Camera",
        quantity: qty,
        price: bayar === "dp" ? Math.round(HARGA_UNIT / 2) : HARGA_UNIT,
        category: "Perangkat IoT",
      },
    ],
    success_redirect_url: "https://markaswalet.com/lp_matawalet_pro/terima-kasih/",
    failure_redirect_url: "https://markaswalet.com/lp_matawalet_pro/?bayar=gagal",
    invoice_duration: 86400, // 24 jam
  };

  let res, inv;
  try {
    res = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(env.XENDIT_SECRET_KEY + ":"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    inv = await res.json();
  } catch (err) {
    console.error("Gagal menghubungi Xendit:", err);
    return json({ error: "Gagal menghubungi penyedia pembayaran. Coba lagi sebentar lagi." }, 502);
  }

  if (!res.ok || !inv.invoice_url) {
    // Pesan asli Xendit hanya untuk log — pengunjung dapat pesan netral + jalur WA.
    console.error("Xendit menolak permintaan:", res.status, JSON.stringify(inv));
    return json(
      {
        error: "Pembayaran gagal dibuat. Silakan hubungi kami via WhatsApp.",
        wa: `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(
          "Halo Markaswalet, saya gagal checkout Pre-Order MataWalet PRO di website."
        )}`,
      },
      502
    );
  }

  return json({ url: inv.invoice_url, external_id: externalId });
}
