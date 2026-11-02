/**
 * Test Suite: WhatsApp Notification System & WAHA Integration
 * 
 * Menguji:
 * 1. Sanitasi nomor telepon & format Chat ID
 * 2. Mode Simulasi (ENABLE_WHATSAPP=false)
 * 3. Pencegahan Pesan Duplikat (Idempotency)
 * 4. Cooldown & Rate Limiting
 * 5. Siklus OTP Keamanan: Hash SHA-256, Expiry, Single-Use, Max 3 Attempts
 * 6. Notifikasi Transaksi: Validasi Consent & Idempotency
 * 7. Notifikasi Server Loss: Format Alert DOWN & UP
 * 8. Error Handling / Fail-Safe saat koneksi WAHA terputus
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
    normalizePhoneNumber,
    formatChatId,
    checkWahaHealth,
    sendTextMessage
} = require('./config/whatsapp');

const {
    sendOtpNotification,
    sendTransactionNotification,
    sendServerAlertNotification
} = require('./config/middleware/sendWhatsApp');

const {
    generateOtp,
    verifyOtp
} = require('./services/otpService');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ [FAIL] ${testName}`);
        failedTests++;
    }
}

async function runTests() {
    console.log('\n======================================================');
    console.log('       PENGUJIAN SISTEM NOTIFIKASI WHATSAPP           ');
    console.log('======================================================\n');

    // -----------------------------------------------------------------
    // TEST 1: Sanitasi Nomor Telepon & Format Chat ID
    // -----------------------------------------------------------------
    console.log('[TEST 1] Sanitasi Nomor Telepon');
    assert(normalizePhoneNumber('081234567890') === '6281234567890', 'Format 08... dikonversi ke 628...');
    assert(normalizePhoneNumber('+6281234567890') === '6281234567890', 'Format +62... dikonversi ke 628...');
    assert(normalizePhoneNumber('0812-3456-7890') === '6281234567890', 'Karakter tanda hubung (-) dihilangkan');
    assert(formatChatId('081234567890') === '6281234567890@c.us', 'Format Chat ID WAHA: ...@c.us');

    // -----------------------------------------------------------------
    // TEST 2: Mode Simulasi Pengiriman Pesan
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Mode Pengujian / Simulasi (ENABLE_WHATSAPP=false)');
    const simResult = await sendTextMessage({
        to: '081234567890',
        text: 'Halo! Ini adalah pesan pengujian dari sistem etalase produk.'
    });
    assert(simResult.success === true, 'Pesan simulasi sukses terkirim');
    assert(simResult.simulated === true, 'Pesan teridentifikasi sebagai simulasi (tidak mengirim ke WhatsApp sungguhan)');
    assert(typeof simResult.messageId === 'string' && simResult.messageId.startsWith('sim_'), 'Mendapatkan ID simulasi unik');

    // -----------------------------------------------------------------
    // TEST 3: Pencegahan Pesan Ganda (Idempotency)
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Pencegahan Pesan Ganda (Idempotency)');
    const customKey = 'test_idempotency_order_999';
    const firstSend = await sendTextMessage({
        to: '081234567890',
        text: 'Pesan idempotency penting',
        idempotencyKey: customKey,
        bypassCooldown: true
    });
    assert(firstSend.success === true, 'Pengiriman pertama berhasil');

    const duplicateSend = await sendTextMessage({
        to: '081234567890',
        text: 'Pesan idempotency penting',
        idempotencyKey: customKey,
        bypassCooldown: true
    });
    assert(duplicateSend.duplicateIgnored === true, 'Pengiriman kedua berhasil dicegah (duplicateIgnored)');

    // -----------------------------------------------------------------
    // TEST 4: Siklus Keamanan OTP Lupa Password
    // -----------------------------------------------------------------
    console.log('\n[TEST 4] Keamanan OTP Lupa Password');
    const testEmail = 'user_test_2026@example.com';
    const genOtp = generateOtp(testEmail);
    assert(genOtp.success === true, 'Generate OTP berhasil');
    assert(/^\d{6}$/.test(genOtp.otp), 'OTP terdiri dari 6 digit angka numerik');
    assert(genOtp.expiresInMinutes === 5, 'OTP memiliki masa berlaku 5 menit');

    // Uji Cooldown Request OTP Ulang
    const rapidGen = generateOtp(testEmail);
    assert(rapidGen.success === false, 'Request OTP ulang sebelum cooldown 60 detik ditolak');
    assert(rapidGen.remainingCooldown > 0, 'Sisa waktu cooldown diinformasikan');

    // Uji Percobaan OTP Salah
    const wrong1 = verifyOtp(testEmail, '000000');
    assert(wrong1.valid === false, 'OTP salah ditolak (percobaan 1)');

    const wrong2 = verifyOtp(testEmail, '111111');
    assert(wrong2.valid === false, 'OTP salah ditolak (percobaan 2)');

    // Uji Verifikasi Berhasil dengan Kode Benar
    const correctVerify = verifyOtp(testEmail, genOtp.otp);
    assert(correctVerify.valid === true, 'Verifikasi dengan kode OTP yang benar BERHASIL');

    // Uji Single Use (Tidak dapat digunakan ulang)
    const reuseVerify = verifyOtp(testEmail, genOtp.otp);
    assert(reuseVerify.valid === false, 'OTP hangus setelah digunakan (Single-Use terpenuhi)');

    // -----------------------------------------------------------------
    // TEST 5: Notifikasi Transaksi & Consent Check
    // -----------------------------------------------------------------
    console.log('\n[TEST 5] Notifikasi Transaksi Produk');
    // A. Tanpa Consent (Wajib ditolak)
    const noConsentResult = await sendTransactionNotification({
        transactionId: 'TRX-TEST-001',
        customerName: 'Ahmad Pelanggan',
        phone: '081298765432',
        items: [{ nama: 'Baju Kaos Katun', qty: 2, harga: 75000 }],
        total: 150000,
        status: 'BERHASIL',
        hasConsent: false
    });
    assert(noConsentResult.success === false, 'Pengiriman tanpa persetujuan (consent) DITOLAK');
    assert(noConsentResult.reason === 'NO_USER_CONSENT', 'Alasan penolakan: NO_USER_CONSENT');

    // B. Dengan Consent (Disetujui)
    const withConsentResult = await sendTransactionNotification({
        transactionId: 'TRX-TEST-002',
        customerName: 'Ahmad Pelanggan',
        phone: '081298765432',
        items: [{ nama: 'Baju Kaos Katun', qty: 2, harga: 75000 }],
        total: 150000,
        status: 'BERHASIL',
        hasConsent: true
    });
    assert(withConsentResult.success === true, 'Pengiriman dengan persetujuan BERHASIL');

    // C. Pencegahan Notifikasi Transaksi Ganda
    const duplicateTrx = await sendTransactionNotification({
        transactionId: 'TRX-TEST-002',
        customerName: 'Ahmad Pelanggan',
        phone: '081298765432',
        items: [{ nama: 'Baju Kaos Katun', qty: 2, harga: 75000 }],
        total: 150000,
        status: 'BERHASIL',
        hasConsent: true
    });
    assert(duplicateTrx.duplicateIgnored === true, 'Notifikasi transaksi kedua dengan ID sama dicegah (Idempotency)');

    // -----------------------------------------------------------------
    // TEST 6: Notifikasi Server Loss (Watchdog Alert)
    // -----------------------------------------------------------------
    console.log('\n[TEST 6] Notifikasi Server Loss & Recovery');
    const downAlert = await sendServerAlertNotification({
        event: 'DOWN',
        details: 'Koneksi ke port 3000 gagal 2x berturut-turut.'
    });
    assert(downAlert.success === true, 'Alert Server DOWN berhasil diproses');

    const upAlert = await sendServerAlertNotification({
        event: 'UP',
        details: 'Backend Express merespons 200 OK.'
    });
    assert(upAlert.success === true, 'Alert Server UP (Recovery) berhasil diproses');

    // -----------------------------------------------------------------
    // TEST 7: Fail-Safe WAHA Offline (Express Tidak Crash)
    // -----------------------------------------------------------------
    console.log('\n[TEST 7] Fail-Safe Koneksi WAHA Offline');
    // Paksa mode LIVE sementara dengan URL fiktif untuk menguji ketahanan error handling
    process.env.ENABLE_WHATSAPP = 'true';
    process.env.WAHA_BASE_URL = 'http://127.0.0.1:59999'; // Port yang tidak aktif
    process.env.WAHA_TIMEOUT_MS = '1000';

    try {
        const failSafeResult = await sendTextMessage({
            to: '081234567890',
            text: 'Uji ketahanan saat server WAHA mati',
            bypassCooldown: true
        });
        assert(failSafeResult.success === false, 'Menangani kegagalan koneksi secara anggun');
        assert(failSafeResult.reason === 'CONNECTION_ERROR' || failSafeResult.reason === 'TIMEOUT', 'Mengembalikan alasan kegagalan yang tepat tanpa melempar error unhandled');
    } catch (unexpectedError) {
        assert(false, `Server Express crash karena unhandled error: ${unexpectedError.message}`);
    }

    // Kembalikan ke mode awal
    process.env.ENABLE_WHATSAPP = 'false';

    // -----------------------------------------------------------------
    // RANGKUMAN HASIL
    // -----------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`TOTAL UJI COBA: ${passedTests + failedTests}`);
    console.log(`LULUS         : ${passedTests}`);
    console.log(`GAGAL         : ${failedTests}`);
    console.log('======================================================');

    if (failedTests === 0) {
        console.log('🎉 SEMUA PENGUJIAN INTEGRASI BERHASIL 100%!\n');
    } else {
        console.error('⚠️ Terdapat pengujian yang gagal. Mohon periksa kembali.');
    }
}

runTests();
