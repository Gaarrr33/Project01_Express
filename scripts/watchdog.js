/**
 * External Watchdog & Health Monitoring Script
 * 
 * Skrip ini berjalan SEBAGAI PROSES TERPISAH (di luar server Express).
 * Tugasnya:
 * 1. Memantau ketersediaan backend Express.js secara berkala (HTTP polling).
 * 2. Mengirim alert WhatsApp ke admin jika backend mati (DOWN).
 * 3. Mengirim notifikasi pemulihan jika backend kembali aktif (UP/RESOLVED).
 * 4. Mencegah notifikasi berulang (spamming) berkat state machine internal.
 * 5. Mencegah false alarm saat restart singkat dengan sistem threshold (2x berturut-turut).
 * 6. Kompatibel dengan mode simulasi (ENABLE_WHATSAPP=false).
 * 
 * Jalankan dengan: node scripts/watchdog.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TARGET_URL = `http://127.0.0.1:${process.env.PORT || 3000}/health`;
const PING_INTERVAL_MS = 5000; // Cek setiap 5 detik
const FAIL_THRESHOLD = 2; // Butuh 2x gagal berturut-turut sebelum trigger DOWN (mencegah false alarm saat restart)
const WAHA_BASE_URL = process.env.WAHA_BASE_URL || 'http://127.0.0.1:3008';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
const ADMIN_PHONE = process.env.WA_ADMIN_PHONE || '6281234567890';
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === 'true';

let currentState = 'UNKNOWN'; // 'UNKNOWN' | 'UP' | 'DOWN'
let consecutiveFailures = 0;

/**
 * Normalisasi nomor WhatsApp
 */
function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    else if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
    return cleaned;
}

/**
 * Kirim alert langsung dari Watchdog ke WAHA HTTP API (independen dari Express)
 */
async function sendAlertDirectly(text) {
    const cleanPhone = normalizePhone(ADMIN_PHONE);
    const chatId = `${cleanPhone}@c.us`;

    if (!ENABLE_WHATSAPP) {
        console.log('\n------------------------------------------------------');
        console.log(' [WATCHDOG SIMULATION ALERT - ENABLE_WHATSAPP=false] ');
        console.log(` Ke       : +${cleanPhone}`);
        console.log(` Waktu    : ${new Date().toLocaleString('id-ID')}`);
        console.log(' Pesan    :');
        console.log(text);
        console.log('------------------------------------------------------\n');
        return { success: true, simulated: true };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`${WAHA_BASE_URL}/api/sendText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WAHA_API_KEY
            },
            body: JSON.stringify({
                chatId: chatId,
                text: text,
                session: WAHA_SESSION
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[WATCHDOG WAHA ERROR] HTTP ${response.status}: ${errText}`);
            return { success: false, error: errText };
        }

        console.log(`[WATCHDOG NOTIFIKASI TERKIRIM] ke +${cleanPhone}`);
        return { success: true };
    } catch (err) {
        console.error('[WATCHDOG GAGAL KIRIM WA]', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Ping backend endpoint
 */
async function pingServer() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(TARGET_URL, { signal: controller.signal });
        clearTimeout(timeout);

        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Loop pemantauan status
 */
async function checkHealth() {
    const isHealthy = await pingServer();
    const timestamp = new Date().toLocaleString('id-ID');

    if (isHealthy) {
        // Backend OK
        if (currentState === 'DOWN') {
            console.log(`[${timestamp}] 🟢 BACKEND PULIH: Transisi dari DOWN -> UP`);
            const recoveryMessage =
`✅ *[RESOLVED] SERVER EXPRESS PULIH* ✅

Backend Express.js kembali merespons dengan normal.

⏱️ *Waktu Pulih*: ${timestamp}
🎯 *Target*: ${TARGET_URL}
📊 *Status*: Healthy (HTTP 200)

Layanan etalase produk aktif kembali.`;

            await sendAlertDirectly(recoveryMessage);
        } else if (currentState === 'UNKNOWN') {
            console.log(`[${timestamp}] 🟢 Watchdog terhubung: Server Express dalam kondisi NORMAL (UP).`);
        }

        currentState = 'UP';
        consecutiveFailures = 0;

    } else {
        // Backend GAGAL merespons
        consecutiveFailures += 1;
        console.warn(`[${timestamp}] ⚠️ Ping gagal (${consecutiveFailures}/${FAIL_THRESHOLD}).`);

        if (consecutiveFailures >= FAIL_THRESHOLD && currentState !== 'DOWN') {
            console.error(`[${timestamp}] 🚨 SERVER CRITICAL: Transisi ke status DOWN!`);
            currentState = 'DOWN';

            const downMessage =
`🚨 *[ALERT] SERVER EXPRESS TIDAK DAPAT DIAKSES* 🚨

Watchdog mendeteksi backend Express.js mengalami gangguan / mati!

⏱️ *Waktu Gangguan*: ${timestamp}
🎯 *Target*: ${TARGET_URL}
⚠️ *Indikator*: ${consecutiveFailures}x ping berturut-turut gagal merespons.

Mohon periksa log atau jalankan ulang server backend.`;

            await sendAlertDirectly(downMessage);
        }
    }
}

console.log('======================================================');
console.log('     FINSTOCK EXTERNAL WATCHDOG MONITORING            ');
console.log('======================================================');
console.log(`Target Polling   : ${TARGET_URL}`);
console.log(`Interval Polling : ${PING_INTERVAL_MS / 1000} detik`);
console.log(`WA Admin Alert   : +${normalizePhone(ADMIN_PHONE)}`);
console.log(`Mode WhatsApp    : ${ENABLE_WHATSAPP ? 'LIVE (WAHA Docker)' : 'SIMULASI (Terminal Only)'}`);
console.log('======================================================');
console.log('Memulai pemantauan...\n');

// Polling interval
setInterval(checkHealth, PING_INTERVAL_MS);
checkHealth();
