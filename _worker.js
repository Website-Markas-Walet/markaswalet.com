/**
 * Cloudflare Pages — advanced mode (_worker.js).
 *
 * Kenapa file ini ada: routing lewat folder functions/ berhenti bekerja di
 * project ini — Functions ter-build & terpetakan di dashboard, tapi permintaan
 * POST tidak pernah sampai ke fungsi (semua path jatuh ke fallback statis, POST
 * jadi 405). _routes.json eksplisit pun diabaikan.
 *
 * Dengan _worker.js, folder functions/ diabaikan dan Worker inilah yang menerima
 * SEMUA permintaan. Kita yang mengatur routing di kode, jadi tidak bergantung
 * pada auto-routing Pages yang rusak. Aset statis disajikan lewat env.ASSETS.
 *
 * Handler-nya tetap di functions/api/*.js (diimpor di bawah) supaya satu sumber
 * kebenaran — file itu masih valid sebagai modul biasa walau tak lagi dirouting
 * otomatis oleh Pages.
 */

import { onRequest as createInvoice } from "./functions/api/create-invoice.js";
import { onRequest as xenditWebhook } from "./functions/api/xendit-webhook.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Rute API — diteruskan ke handler. Handler sendiri yang menyaring metode
    // (mereka mengekspor onRequest, bukan onRequestPost).
    if (url.pathname === "/api/create-invoice") {
      return createInvoice({ request, env, ctx });
    }
    if (url.pathname === "/api/xendit-webhook") {
      return xenditWebhook({ request, env, ctx });
    }

    // Sisanya: aset statis (LP, checkout.js, dst) apa adanya.
    return env.ASSETS.fetch(request);
  },
};
