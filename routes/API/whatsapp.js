const express = require('express');
const router = express.Router();
const { checkWahaHealth, sendTextMessage } = require('../../config/whatsapp');
const { sendTransactionNotification } = require('../../config/middleware/sendWhatsApp');

/**
 * GET /api/whatsapp/status
 * Cek status WAHA, Sesi, dan Mode Pengujian
 */
router.get('/status', async (req, res) => {
    try {
        const health = await checkWahaHealth();
        return res.status(200).json({
            success: true,
            mode: process.env.ENABLE_WHATSAPP === 'true' ? 'LIVE_WAHA' : 'SIMULATION_MODE',
            wahaBaseUrl: process.env.WAHA_BASE_URL || 'http://127.0.0.1:3008',
            session: process.env.WAHA_SESSION || 'default',
            health: health
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * POST /api/whatsapp/send-test
 * Kirim pesan pengujian bebas
 * Body: { to, message }
 */
router.post('/send-test', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({
            success: false,
            message: 'Parameter "to" dan "message" wajib diisi.'
        });
    }

    const result = await sendTextMessage({
        to,
        text: message
    });

    return res.status(result.success ? 200 : 400).json(result);
});

/**
 * POST /api/whatsapp/send-transaction
 * Endpoint pengujian notifikasi transaksi dengan verifikasi persetujuan (Consent)
 * dan proteksi pesan ganda (Idempotency).
 * 
 * Body: {
 *   transactionId: "TRX-1001",
 *   customerName: "Budi Santoso",
 *   phone: "081234567890",
 *   items: [{ nama: "Sepatu Running", qty: 1, harga: 250000 }],
 *   total: 250000,
 *   status: "BERHASIL",
 *   hasConsent: true
 * }
 */
router.post('/send-transaction', async (req, res) => {
    const { transactionId, customerName, phone, items, total, status, hasConsent } = req.body;

    if (!transactionId || !phone) {
        return res.status(400).json({
            success: false,
            message: 'transactionId dan phone wajib disertakan.'
        });
    }

    const result = await sendTransactionNotification({
        transactionId,
        customerName: customerName || 'Pelanggan',
        phone,
        items: items || [],
        total: total || 0,
        status: status || 'BERHASIL',
        hasConsent: hasConsent === true || hasConsent === 'true'
    });

    return res.status(result.success ? 200 : 400).json(result);
});

module.exports = router;
