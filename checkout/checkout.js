/* ===================================================================
   Checkout MataWalet PRO — modal pemesanan + pembuatan invoice Xendit.
   Dipakai bersama oleh 3 landing page (a/conversion, b/awareness,
   c/consideration). Modal-nya disuntik sendiri oleh script ini, jadi
   tiap LP cukup menambahkan:

     <link rel="stylesheet" href="/checkout/checkout.css">
     <script src="/checkout/checkout.js" defer></script>

   lalu beri class "js-order" pada tombol mana pun yang harus membuka form.

   Harga bisa ditimpa per halaman lewat atribut pada tag script:
     <script src="/checkout/checkout.js" data-harga="1500000" defer></script>
   Harga di sini hanya untuk TAMPILAN. Nominal yang ditagih tetap
   dihitung ulang di functions/api/create-invoice.js — jangan pernah
   percaya angka yang datang dari browser.
   =================================================================== */

(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var HARGA = parseInt(script && script.getAttribute('data-harga'), 10) || 1500000;
  var WA = (script && script.getAttribute('data-wa')) || '6285235350662';
  var MAX_QTY = 5;

  function rupiah(n) { return 'Rp ' + n.toLocaleString('id-ID'); }

  // ---- Analitik ------------------------------------------------------------
  // Varian LP dikirim di tiap event supaya ketiga halaman bisa dibandingkan.
  // Ingat: tiap LP ada di tahap funnel berbeda, jadi angkanya tidak untuk
  // diadu langsung — LP awareness memang wajar punya konversi lebih rendah.
  var VARIAN = {
    '/lp_matawalet_pro/': 'lp-a-conversion',
    '/lp_matawalet_pro_b/': 'lp-b-awareness',
    '/lp_matawalet_pro_c/': 'lp-c-consideration'
  };
  var lpVarian = VARIAN[location.pathname.replace(/index\.html$/, '')] || 'lain';

  function lacak(nama, data) {
    window.dataLayer = window.dataLayer || [];
    // ecommerce dikosongkan dulu agar data event sebelumnya tidak ikut terbawa.
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(Object.assign({ event: nama, lp_varian: lpVarian }, data));
  }

  function itemPesanan(qty) {
    return [{
      item_id: 'matawalet-pro',
      item_name: 'MataWalet PRO — AI IoT Camera',
      item_brand: 'Markas Walet',
      price: HARGA,
      quantity: qty || 1
    }];
  }

  // ---- Suntik markup modal -------------------------------------------------
  var opsiQty = '';
  for (var i = 1; i <= MAX_QTY; i++) opsiQty += '<option value="' + i + '">' + i + ' unit</option>';

  var wrap = document.createElement('div');
  wrap.className = 'om';
  wrap.id = 'orderModal';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-labelledby', 'omTitle');
  wrap.innerHTML =
    '<div class="om-box">' +
      '<button class="om-x" id="omClose" type="button" aria-label="Tutup form pemesanan">&times;</button>' +
      '<div class="om-hd">' +
        '<h3 id="omTitle">Amankan Slot Pre-Order</h3>' +
        '<p>Isi data singkat, lalu selesaikan pembayaran. Alamat pengiriman kami konfirmasi via WhatsApp setelahnya.</p>' +
      '</div>' +
      '<div class="om-bd">' +
        '<div class="om-err" id="omErr" role="alert"></div>' +
        '<form id="omForm" novalidate>' +
          '<div class="om-f"><label for="omNama">Nama Lengkap</label>' +
            '<input type="text" id="omNama" name="nama" autocomplete="name" required placeholder="Nama sesuai identitas"></div>' +
          '<div class="om-f"><label for="omPhone">Nomor WhatsApp</label>' +
            '<input type="tel" id="omPhone" name="phone" autocomplete="tel" required placeholder="08xxxxxxxxxx" inputmode="numeric">' +
            '<div class="hint">Dipakai untuk konfirmasi alamat &amp; nomor resi.</div></div>' +
          '<div class="om-f"><label for="omEmail">Email</label>' +
            '<input type="email" id="omEmail" name="email" autocomplete="email" required placeholder="nama@email.com">' +
            '<div class="hint">Invoice dan bukti bayar dikirim ke sini.</div></div>' +
          '<div class="om-f"><label for="omQty">Jumlah Unit</label>' +
            '<select id="omQty" name="qty">' + opsiQty + '</select></div>' +
          '<div class="om-f"><label>Metode Pembayaran</label><div class="om-pay">' +
            '<label><input type="radio" name="bayar" value="lunas" checked>' +
              '<span class="opt"><b>Lunas</b><span>Prioritas pengiriman</span></span></label>' +
            '<label><input type="radio" name="bayar" value="dp">' +
              '<span class="opt"><b>DP 50%</b><span>Amankan slot</span></span></label>' +
          '</div></div>' +
          '<div class="om-total"><span id="omTotalLbl">Total bayar sekarang</span><b id="omTotal">' + rupiah(HARGA) + '</b></div>' +
          '<button type="submit" class="btn btn-primary om-sub" id="omSubmit">Lanjut ke Pembayaran →</button>' +
          '<p class="om-note">Pembayaran diproses aman oleh Xendit. Tersedia transfer bank, e-wallet, QRIS, dan kartu kredit.</p>' +
          '<div class="om-wa">Masih ada pertanyaan? <a href="https://wa.me/' + WA +
            '?text=Halo%20Markaswalet%2C%20saya%20mau%20tanya%20soal%20MataWalet%20PRO" target="_blank" rel="noopener">Tanya via WhatsApp</a></div>' +
        '</form>' +
      '</div>' +
    '</div>';

  document.body.appendChild(wrap);

  var form = wrap.querySelector('#omForm'),
      err = wrap.querySelector('#omErr'),
      btn = wrap.querySelector('#omSubmit'),
      totalEl = wrap.querySelector('#omTotal'),
      totalLbl = wrap.querySelector('#omTotalLbl'),
      qtyEl = wrap.querySelector('#omQty'),
      lastFocus = null;

  function bayarVal() {
    var r = form.querySelector('input[name="bayar"]:checked');
    return r ? r.value : 'lunas';
  }

  function hitung() {
    var qty = parseInt(qtyEl.value, 10) || 1,
        dp = bayarVal() === 'dp',
        total = HARGA * qty,
        bayar = dp ? Math.round(total / 2) : total;
    totalEl.textContent = rupiah(bayar);
    totalLbl.textContent = dp ? 'DP 50% — sisa ' + rupiah(total - bayar) : 'Total bayar sekarang';
  }

  function open() {
    lastFocus = document.activeElement;
    err.classList.remove('show');
    wrap.classList.add('open');
    document.body.style.overflow = 'hidden';
    hitung();
    lacak('begin_checkout', {
      ecommerce: { currency: 'IDR', value: HARGA, items: itemPesanan(1) }
    });
    setTimeout(function () { wrap.querySelector('#omNama').focus(); }, 50);
  }

  function close() {
    wrap.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function gagal(msg, waUrl) {
    err.innerHTML = waUrl ? msg + ' <a href="' + waUrl + '" target="_blank" rel="noopener">Hubungi WhatsApp</a>' : msg;
    err.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Lanjut ke Pembayaran →';
    err.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---- Pemasangan ke tombol-tombol LP -------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('.js-order'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });

  wrap.querySelector('#omClose').addEventListener('click', close);
  wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wrap.classList.contains('open')) close();
  });

  form.addEventListener('change', hitung);
  qtyEl.addEventListener('input', hitung);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.classList.remove('show');

    var nama = wrap.querySelector('#omNama').value.trim(),
        email = wrap.querySelector('#omEmail').value.trim(),
        phone = wrap.querySelector('#omPhone').value.replace(/[\s-]/g, '');

    if (nama.length < 3) return gagal('Mohon isi nama lengkap Anda.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return gagal('Format email belum benar.');
    if (!/^(\+?62|0)8\d{7,12}$/.test(phone)) return gagal('Nomor WhatsApp belum benar. Contoh: 081234567890');

    btn.disabled = true;
    btn.textContent = 'Menyiapkan pembayaran…';

    fetch('/api/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: nama,
        email: email,
        phone: phone,
        qty: qtyEl.value,
        bayar: bayarVal(),
        // Menandai LP asal supaya konversi tiap varian bisa dibandingkan
        // langsung dari daftar invoice di dashboard Xendit.
        sumber: location.pathname
      })
    })
      .then(function (r) {
        // Respons bisa saja bukan JSON — misalnya halaman 404 saat deployment
        // belum siap, atau halaman error dari Cloudflare. Ditangani terpisah
        // supaya pesannya menunjuk penyebab sebenarnya, bukan menuduh jaringan.
        return r.text().then(function (teks) {
          var data;
          try { data = JSON.parse(teks); }
          catch (e) {
            console.error('[checkout] respons bukan JSON', r.status, teks.slice(0, 200));
            throw new Error(
              r.status === 404
                ? 'Layanan pembayaran belum aktif di halaman ini (404).'
                : 'Server membalas dengan format tak terduga (HTTP ' + r.status + ').'
            );
          }
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        // Kegagalan dikirim server sebagai HTTP 200 dengan ok:false — status 5xx
        // tidak dipakai karena Cloudflare mengganti bodinya dengan halaman HTML.
        if (res.data.url) {
          // Invoice berhasil dibuat — pengunjung akan diteruskan ke Xendit.
          // Ini langkah funnel terakhir yang masih bisa kita lihat di situs kita.
          var q = parseInt(qtyEl.value, 10) || 1;
          var t = HARGA * q;
          lacak('add_payment_info', {
            ecommerce: {
              currency: 'IDR',
              value: bayarVal() === 'dp' ? Math.round(t / 2) : t,
              payment_type: bayarVal() === 'dp' ? 'DP 50%' : 'Lunas',
              items: itemPesanan(q)
            }
          });
          window.location.href = res.data.url;
          return;
        }
        console.error('[checkout] ditolak server', res.data);
        gagal(res.data.error || 'Pembayaran gagal dibuat. Silakan coba lagi.', res.data.wa);
      })
      .catch(function (e) {
        console.error('[checkout] gagal', e);
        // TypeError dari fetch = benar-benar tidak sampai ke server.
        var jaringan = e instanceof TypeError;
        gagal(
          jaringan
            ? 'Koneksi bermasalah. Periksa jaringan Anda lalu coba lagi.'
            : e.message + ' Silakan coba lagi atau hubungi kami via WhatsApp.',
          jaringan ? null : 'https://wa.me/' + WA + '?text=' + encodeURIComponent(
            'Halo Markaswalet, saya gagal checkout MataWalet PRO di website.')
        );
      });
  });

  // Pengunjung yang batal/gagal bayar dikembalikan dengan ?bayar=gagal
  if (location.search.indexOf('bayar=gagal') > -1) {
    open();
    gagal('Pembayaran sebelumnya tidak selesai. Silakan coba lagi.');
  }
})();
