/**
 * Cloudflare Pages Function — webhook pembayaran Xendit.
 *
 * Endpoint: POST /api/xendit-webhook
 * Daftarkan URL ini di Xendit → Settings → Webhooks → Invoices paid.
 *
 * Kenapa ada: event `purchase` di halaman terima kasih hanya menyala kalau
 * pembeli KEMBALI ke situs setelah membayar. Yang bayar lewat VA/transfer lalu
 * menutup browser tidak pernah terhitung. Webhook menyala dari server Xendit,
 * jadi pembayaran tercatat apa pun yang dilakukan pembeli.
 *
 * Yang dikirim: event Purchase ke Meta Conversions API, lengkap dengan email
 * dan nomor telepon ter-hash. Pixel browser saat ini hanya mengirim IP dan
 * user-agent (skor pencocokan 3/10) — dua identitas ini yang menaikkannya.
 *
 * Environment variables yang dibutuhkan (Cloudflare → Settings → Secret):
 *   XENDIT_CALLBACK_TOKEN  token verifikasi dari Xendit → Webhooks
 *   META_CAPI_TOKEN        access token dari Meta Events Manager → Settings
 *   META_PIXEL_ID          opsional, default ke pixel PT Markaswalet
 */

const PIXEL_DEFAULT = "2836662576577682";
const GRAPH_VERSION = "v21.0";

const VARIAN = {
  "lp-a-conversion": "/lp_matawalet_pro/",
  "lp-b-awareness": "/lp_matawalet_pro_b/",
  "lp-c-consideration": "/lp_matawalet_pro_c/",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** SHA-256 hex — format yang diminta Meta untuk semua data pengenal. */
async function hash(nilai) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nilai));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Meta minta nomor telepon hanya angka, berawalan kode negara, tanpa "+" dan tanpa nol depan. */
function normalkanTelepon(no) {
  const angka = String(no || "").replace(/\D/g, "");
  if (!angka) return "";
  if (angka.startsWith("62")) return angka;
  if (angka.startsWith("0")) return "62" + angka.slice(1);
  return angka;
}

export async function onRequestPost(ctx) {
  try {
    return await tanganiWebhook(ctx);
  } catch (err) {
    console.error("Webhook gagal:", err && err.stack ? err.stack : err);
    // Balas 200 supaya Xendit tidak mengulang terus-menerus karena bug di sisi
    // kami. Kegagalan tetap tercatat di log untuk ditelusuri.
    return json({ ok: false, error: "kesalahan internal" });
  }
}

async function tanganiWebhook({ request, env }) {
  // --- Verifikasi pengirim -------------------------------------------------
  // Tanpa ini siapa pun bisa mengarang notifikasi "sudah bayar" ke endpoint ini.
  const token = request.headers.get("x-callback-token");
  if (!env.XENDIT_CALLBACK_TOKEN) {
    console.error("XENDIT_CALLBACK_TOKEN belum di-set");
    return json({ ok: false, error: "belum dikonfigurasi" }, 503);
  }
  if (token !== env.XENDIT_CALLBACK_TOKEN) {
    console.error("Token callback tidak cocok — permintaan ditolak");
    return json({ ok: false, error: "tidak diizinkan" }, 401);
  }

  const inv = await request.json();

  // Hanya invoice lunas yang menarik. Sisanya diakui tapi diabaikan.
  if (inv.status !== "PAID" && inv.status !== "SETTLED") {
    return json({ ok: true, diabaikan: inv.status });
  }

  const externalId = String(inv.external_id || "");
  const email = String(inv.payer_email || (inv.customer && inv.customer.email) || "").trim().toLowerCase();
  const telepon = normalkanTelepon(inv.customer && inv.customer.mobile_number);
  const nilai = Number(inv.paid_amount || inv.amount || 0);

  // Varian LP tersimpan di external_id (lihat create-invoice.js)
  const varian = Object.keys(VARIAN).find((v) => externalId.includes(v)) || "lain";

  if (!env.META_CAPI_TOKEN) {
    console.error("META_CAPI_TOKEN belum di-set — Purchase tidak dikirim");
    return json({ ok: true, terkirim: false, alasan: "token-meta-tidak-ada" });
  }

  const userData = {
    // Meta menerima beberapa nilai per kunci; kirim yang kita punya saja.
    ...(email ? { em: [await hash(email)] } : {}),
    ...(telepon ? { ph: [await hash(telepon)] } : {}),
    ...(externalId ? { external_id: [await hash(externalId)] } : {}),
  };

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        // event_id sama dengan yang dikirim pixel browser (nomor pesanan),
        // supaya Meta menggabungkan keduanya dan tidak menghitung dua kali.
        event_id: externalId,
        event_source_url: "https://markaswalet.com" + (VARIAN[varian] || "/lp_matawalet_pro/"),
        user_data: userData,
        custom_data: {
          currency: inv.currency || "IDR",
          value: nilai,
          content_ids: ["matawalet-pro"],
          content_type: "product",
          content_name: "MataWalet PRO — AI IoT Camera",
          order_id: externalId,
        },
      },
    ],
  };

  const pixel = env.META_PIXEL_ID || PIXEL_DEFAULT;
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pixel}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const hasil = await res.json();

  if (!res.ok) {
    console.error("Meta CAPI menolak:", res.status, JSON.stringify(hasil));
    return json({ ok: true, terkirim: false, meta: res.status });
  }

  console.log(
    `Purchase terkirim ke Meta — ${externalId} · Rp ${nilai} · ${varian} · ` +
      `email:${email ? "ada" : "-"} telepon:${telepon ? "ada" : "-"}`
  );
  return json({ ok: true, terkirim: true, external_id: externalId });
}
