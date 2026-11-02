/**
 * WhatsApp Middleware & Notification Dispatcher
 * 
 * Modul ini menyediakan fungsi terstandarisasi untuk mengirim:
 * 1. Pesan Umum (General WhatsApp Message)
 * 2. OTP Reset Password (dengan masa berlaku & security disclaimer)
 * 3. Notifikasi Transaksi (dengan validasi persetujuan & pencegahan duplikasi)
 * 4. Alert Server Loss (untuk Watchdog / Server Down monitoring)
 */

const { sendTextMessage, normalizePhoneNumber } = require('../whatsapp');

/**
 * Kirim Notifikasi OTP Lupa Password via WhatsApp
 * @param {Object} params
 * @param {string} params.to - Nomor WhatsApp penerima
 * @param {string} params.otp - Kode OTP angka (6 digit)
 * @param {string} [params.userName] - Nama / identifier user
 * @param {number} [params.expiresInMinutes=5] - Masa berlaku dalam menit
 * @returns {Promise<Object>}
 */
async function sendOtpNotification({ to, otp, userName, expiresInMinutes = 5 }) {
    const greeting = userName ? `Halo *${userName}*,` : 'Halo,';
    const message = 
`${greeting}

Berikut adalah Kode OTP untuk verifikasi reset password akun Anda:

🔑 *${otp}*

⏳ Kode ini hanya berlaku selama *${expiresInMinutes} menit* dan hanya dapat digunakan 1 (satu) kali.

⚠️ *PENTING*:
- JANGAN berikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai admin.
- Jika Anda tidak merasa meminta reset password, abaikan pesan ini dengan aman.`;

    // Gunakan bypassCooldown=false agar pengiriman dibatasi
    return await sendTextMessage({
        to,
        text: message,
        idempotencyKey: `otp_${normalizePhoneNumber(to)}_${otp}`
    });
}

/**
 * Kirim Notifikasi Transaksi Produk via WhatsApp
 * 
 * @param {Object} params
 * @param {string|number} params.transactionId - ID Transaksi unik
 * @param {string} params.customerName - Nama pelanggan
 * @param {string} params.phone - Nomor WhatsApp pelanggan
 * @param {Array<{ nama: string, qty: number, harga: number }>} params.items - Daftar produk
 * @param {number} params.total - Total pembayaran
 * @param {string} params.status - Status transaksi (misal: "BERHASIL", "MENUNGGU PEMBAYARAN")
 * @param {boolean} params.hasConsent - Apakah pelanggan menyetujui pengiriman notifikasi WhatsApp
 * @returns {Promise<Object>}
 */
async function sendTransactionNotification({
    transactionId,
    customerName,
    phone,
    items = [],
    total = 0,
    status = 'BERHASIL',
    hasConsent = false
}) {
    // Kebijakan Keamanan: Kirim HANYA jika pelanggan telah memberikan persetujuan (opt-in)
    if (!hasConsent) {
        console.warn(`[WA NOTIF] Pengiriman transaksi #${transactionId} dibatalkan karena tidak ada consent.`);
        return {
            success: false,
            reason: 'NO_USER_CONSENT',
            error: 'Notifikasi dibatalkan: Pelanggan belum memberikan persetujuan pengiriman WhatsApp.'
        };
    }

    if (!transactionId) {
        return {
            success: false,
            reason: 'INVALID_TRANSACTION_ID',
            error: 'Transaction ID wajib disertakan.'
        };
    }

    const formattedTotal = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(total);

    let itemsList = '';
    if (Array.isArray(items) && items.length > 0) {
        itemsList = items.map((item, idx) => {
            const subtotal = (item.qty || 1) * (item.harga || 0);
            return `${idx + 1}. *${item.nama}* x${item.qty || 1} = Rp ${subtotal.toLocaleString('id-ID')}`;
        }).join('\n');
    } else {
        itemsList = '- (Detail produk standar)';
    }

    const message =
`🧾 *NOTIFIKASI TRANSAKSI PRODUK*

Halo *${customerName || 'Pelanggan'}*, terima kasih telah berbelanja!

📌 *ID Transaksi*: #${transactionId}
📅 *Waktu*: ${new Date().toLocaleString('id-ID')}
📊 *Status*: *${status.toUpperCase()}*

🛒 *Rincian Pesanan*:
${itemsList}

💰 *Total Pembayaran*: *${formattedTotal}*

Jika ada pertanyaan seputar pesanan Anda, silakan hubungi tim layanan pelanggan kami.`;

    // Gunakan idempotencyKey berbasis transactionId agar tidak pernah terkirim ganda
    return await sendTextMessage({
        to: phone,
        text: message,
        idempotencyKey: `trx_${transactionId}`
    });
}

/**
 * Kirim Notifikasi Darurat Server Loss / Watchdog
 * @param {Object} params
 * @param {'DOWN'|'UP'} params.event - Jenis event server
 * @param {string} [params.details] - Rincian teknis status server
 * @param {string} [params.adminPhone] - Nomor admin penerima
 * @returns {Promise<Object>}
 */
async function sendServerAlertNotification({ event, details, adminPhone }) {
    const target = adminPhone || process.env.WA_ADMIN_PHONE;
    if (!target) {
        console.warn('[WATCHDOG ALERT] Nomor WA_ADMIN_PHONE belum diset di .env');
        return {
            success: false,
            reason: 'NO_ADMIN_PHONE',
            error: 'Nomor WA admin belum dikonfigurasi.'
        };
    }

    let message = '';
    const timestamp = new Date().toLocaleString('id-ID');

    if (event === 'DOWN') {
        message =
`🚨 *[ALERT] SERVER DOWN TERDETEKSI* 🚨

Sistem Watchdog mendeteksi backend Express.js tidak dapat diakses!

⏱️ *Waktu Kejadian*: ${timestamp}
⚠️ *Kondisi*: Koneksi HTTP ke backend gagal / timeout.
📝 *Detail*: ${details || 'Layanan tidak merespons health check.'}

Harap segera periksa kondisi server utama.`;
    } else {
        message =
`✅ *[RESOLVED] SERVER KEMBALI NORMAL* ✅

Sistem Watchdog mengonfirmasi backend Express.js telah pulih dan aktif kembali.

⏱️ *Waktu Pemulihan*: ${timestamp}
📊 *Status*: Healthy / OK
📝 *Detail*: ${details || 'Health check kembali merespons status 200.'}

Operasional kembali berjalan normal.`;
    }

    // Bypass normal cooldown untuk alert kritis server
    return await sendTextMessage({
        to: target,
        text: message,
        idempotencyKey: `srv_${event}_${Math.floor(Date.now() / 60000)}`, // Max 1 per menit
        bypassCooldown: true
    });
}

/**
 * Middleware Express untuk menyisipkan fungsi WhatsApp ke object `req`
 */
function sendWhatsAppMiddleware(req, res, next) {
    req.sendWhatsApp = sendTextMessage;
    req.sendOtp = sendOtpNotification;
    req.sendTransaction = sendTransactionNotification;
    next();
}

module.exports = {
    sendWhatsAppMiddleware,
    sendWhatsAppMessage: sendTextMessage,
    sendOtpNotification,
    sendTransactionNotification,
    sendServerAlertNotification
};
