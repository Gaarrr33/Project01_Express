/**
 * WhatsApp Service Client (WAHA Core HTTP API)
 * 
 * - Mendukung Mode Simulasi (ENABLE_WHATSAPP=false) agar pengujian aman tanpa risiko blokir nomor.
 * - Terintegrasi dengan timeout (AbortController) dan error handling fail-safe.
 * - Dilengkapi pencegahan pesan duplikat (Idempotency) & Cooldown via NodeCache.
 * - Tidak membocorkan kredensial (semua diambil dari process.env).
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');

// Inisialisasi cache untuk idempotency & cooldown (TTL 5 menit)
const idempotencyCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
// Cache cooldown per penerima (misal minimal 30 detik antar pesan ke nomor yang sama)
const recipientCooldownCache = new NodeCache({ stdTTL: 30, checkperiod: 15 });

/**
 * Normalisasi format nomor WhatsApp Indonesia ke format internasional (misal: 6281234567890)
 * @param {string} phone 
 * @returns {string} Clean international phone number
 */
function normalizePhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

/**
 * Format nomor WhatsApp ke Chat ID WAHA (contoh: 6281234567890@c.us)
 * @param {string} phone 
 * @returns {string} chatId
 */
function formatChatId(phone) {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) return '';
    return `${normalized}@c.us`;
}

/**
 * Cek status kesehatan / sesi WAHA
 * @returns {Promise<{ ok: boolean, status: string, details?: any }>}
 */
async function checkWahaHealth() {
    const isLive = process.env.ENABLE_WHATSAPP === 'true';
    if (!isLive) {
        return {
            ok: true,
            status: 'SIMULATION_MODE',
            details: 'WhatsApp live sending is currently disabled (ENABLE_WHATSAPP=false).'
        };
    }

    const baseUrl = process.env.WAHA_BASE_URL || 'http://127.0.0.1:3008';
    const apiKey = process.env.WAHA_API_KEY || '';
    const session = process.env.WAHA_SESSION || 'default';
    const timeoutMs = parseInt(process.env.WAHA_TIMEOUT_MS, 10) || 5000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${baseUrl}/api/sessions/${session}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return {
                ok: false,
                status: 'SESSION_NOT_READY',
                statusCode: response.status
            };
        }

        const data = await response.json();
        return {
            ok: true,
            status: data.status || 'CONNECTED',
            details: data
        };
    } catch (err) {
        clearTimeout(timeout);
        return {
            ok: false,
            status: 'WAHA_UNREACHABLE',
            error: err.name === 'AbortError' ? 'Timeout reaching WAHA' : err.message
        };
    }
}

/**
 * Kirim pesan teks WhatsApp menggunakan WAHA Core atau Mode Simulasi
 * 
 * @param {Object} options
 * @param {string} options.to - Nomor telepon tujuan
 * @param {string} options.text - Teks pesan
 * @param {string} [options.idempotencyKey] - Kunci pencegah duplikasi (opsional)
 * @param {boolean} [options.bypassCooldown] - Lewati cooldown (hanya untuk alert darurat server)
 * @returns {Promise<{ success: boolean, simulated?: boolean, messageId?: string, error?: string, reason?: string }>}
 */
async function sendTextMessage({ to, text, idempotencyKey, bypassCooldown = false }) {
    try {
        const normalizedPhone = normalizePhoneNumber(to);
        if (!normalizedPhone || normalizedPhone.length < 10) {
            return {
                success: false,
                reason: 'INVALID_PHONE_NUMBER',
                error: 'Nomor telepon tujuan tidak valid (minimal 10 digit).'
            };
        }

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return {
                success: false,
                reason: 'EMPTY_MESSAGE',
                error: 'Isi pesan WhatsApp tidak boleh kosong.'
            };
        }

        // 1. Pencegahan Pesan Ganda (Idempotency)
        const dedupKey = idempotencyKey || crypto.createHash('sha256').update(`${normalizedPhone}:${text}`).digest('hex');
        if (idempotencyCache.has(dedupKey)) {
            console.warn(`[WAHA IDEMPOTENCY] Pesan duplikat terdeteksi untuk key: ${dedupKey}. Pengiriman diabaikan.`);
            return {
                success: true,
                duplicateIgnored: true,
                cachedMessageId: idempotencyCache.get(dedupKey),
                reason: 'DUPLICATE_MESSAGE_IGNORED'
            };
        }

        // 2. Pencegahan Spam / Cooldown Per Penerima (Risk Reduction)
        if (!bypassCooldown) {
            if (recipientCooldownCache.has(normalizedPhone)) {
                return {
                    success: false,
                    reason: 'RATE_LIMIT_COOLDOWN',
                    error: 'Harap tunggu beberapa saat sebelum mengirim pesan kembali ke nomor ini (cooldown aktif).'
                };
            }
        }

        const isLive = process.env.ENABLE_WHATSAPP === 'true';

        // 3. Mode Pengujian (Simulasi)
        if (!isLive) {
            const simulatedId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            console.log('\n======================================================');
            console.log('       [WHATSAPP SIMULATION MODE - SAFE TESTING]      ');
            console.log('======================================================');
            console.log(`Waktu   : ${new Date().toLocaleString('id-ID')}`);
            console.log(`Tujuan  : +${normalizedPhone} (${formatChatId(normalizedPhone)})`);
            console.log(`Status  : SIMULASI BERHASIL (ENABLE_WHATSAPP=false)`);
            console.log('Isi Pesan:');
            console.log('------------------------------------------------------');
            console.log(text);
            console.log('------------------------------------------------------');
            console.log(`Simulated ID: ${simulatedId}`);
            console.log('======================================================\n');

            // Simpan cache agar tidak dikirim ulang secara tidak sengaja
            idempotencyCache.set(dedupKey, simulatedId);
            if (!bypassCooldown) recipientCooldownCache.set(normalizedPhone, true);

            return {
                success: true,
                simulated: true,
                messageId: simulatedId
            };
        }

        // 4. Mode Nyata (WAHA Core HTTP API via Docker)
        const baseUrl = process.env.WAHA_BASE_URL || 'http://127.0.0.1:3008';
        const apiKey = process.env.WAHA_API_KEY || '';
        const session = process.env.WAHA_SESSION || 'default';
        const timeoutMs = parseInt(process.env.WAHA_TIMEOUT_MS, 10) || 8000;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const payload = {
            chatId: formatChatId(normalizedPhone),
            text: text,
            session: session
        };

        const response = await fetch(`${baseUrl}/api/sendText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.error(`[WAHA ERROR] HTTP ${response.status}: ${errorBody}`);
            return {
                success: false,
                reason: 'WAHA_API_ERROR',
                statusCode: response.status,
                error: `WAHA mengembalikan status ${response.status}: ${errorBody}`
            };
        }

        const responseData = await response.json().catch(() => ({}));
        const realMessageId = responseData.id || `waha_${Date.now()}`;

        // Tandai idempotency & cooldown
        idempotencyCache.set(dedupKey, realMessageId);
        if (!bypassCooldown) recipientCooldownCache.set(normalizedPhone, true);

        return {
            success: true,
            simulated: false,
            messageId: realMessageId,
            data: responseData
        };

    } catch (error) {
        // FAIL-SAFE: Tangani kegagalan koneksi agar Express TIDAK crash
        console.error('[WAHA CONNECTION FAILURE]', error.message);
        return {
            success: false,
            reason: error.name === 'AbortError' ? 'TIMEOUT' : 'CONNECTION_ERROR',
            error: error.message
        };
    }
}

module.exports = {
    normalizePhoneNumber,
    formatChatId,
    checkWahaHealth,
    sendTextMessage
};
