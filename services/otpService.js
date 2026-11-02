/**
 * OTP Service for Secure Password Reset
 * 
 * Fitur Keamanan:
 * 1. OTP Acak 6 Digit (kriptografis aman via crypto.randomInt).
 * 2. OTP TIDAK disimpan dalam bentuk teks biasa (disimpan dalam bentuk hash SHA-256).
 * 3. Masa berlaku otomatis (Default: 5 menit / 300 detik via TTL cache).
 * 4. Penggunaan sekali pakai (Single Use: langsung dihapus setelah berhasil diverifikasi).
 * 5. Pembatasan percobaan verifikasi (Maksimal 3 kali salah, setelah itu OTP hangus).
 * 6. Cooldown permintaan kirim ulang (Minimal 60 detik antar permintaan).
 */

const crypto = require('crypto');
const NodeCache = require('node-cache');

// Cache untuk menyimpan state OTP terenkripsi (TTL 5 menit)
const otpStore = new NodeCache({ stdTTL: 300, checkperiod: 30 });
// Cache cooldown request OTP baru (TTL 60 detik)
const cooldownStore = new NodeCache({ stdTTL: 60, checkperiod: 15 });

const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_SECONDS = 300; // 5 menit
const COOLDOWN_SECONDS = 60; // 1 menit

/**
 * Hash kode OTP menggunakan SHA-256 agar tidak tersimpan sebagai plain text
 * @param {string} otp 
 * @param {string} salt 
 * @returns {string} Hashed OTP
 */
function hashOtp(otp, salt) {
    return crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex');
}

/**
 * Generate dan simpan OTP baru dengan enkripsi
 * @param {string} identifier - Email atau nomor HP pengguna
 * @returns {{ success: boolean, otp?: string, error?: string, remainingCooldown?: number }}
 */
function generateOtp(identifier) {
    const key = identifier.toLowerCase().trim();

    // 1. Cek Cooldown Pengiriman
    if (cooldownStore.has(key)) {
        const ttl = cooldownStore.getTtl(key);
        const remainingSeconds = Math.max(0, Math.ceil((ttl - Date.now()) / 1000));
        return {
            success: false,
            error: `Mohon tunggu ${remainingSeconds} detik sebelum meminta kode OTP baru.`,
            remainingCooldown: remainingSeconds
        };
    }

    // 2. Generate 6 Digit Random Number secara kriptografis
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hashed = hashOtp(rawOtp, salt);

    // 3. Simpan hanya HASH dan metadata (BUKAN plain OTP)
    otpStore.set(key, {
        hashedOtp: hashed,
        salt: salt,
        attempts: 0,
        createdAt: Date.now(),
        expiresAt: Date.now() + (OTP_EXPIRY_SECONDS * 1000)
    }, OTP_EXPIRY_SECONDS);

    // 4. Set Cooldown pengiriman
    cooldownStore.set(key, true, COOLDOWN_SECONDS);

    return {
        success: true,
        otp: rawOtp, // Dikembalikan HANYA saat ini untuk dikirimkan via WhatsApp ke penerima sah
        expiresInMinutes: OTP_EXPIRY_SECONDS / 60
    };
}

/**
 * Verifikasi kode OTP yang dimasukkan user
 * @param {string} identifier - Email atau nomor HP pengguna
 * @param {string} inputOtp - Kode OTP yang diinput
 * @returns {{ valid: boolean, message: string }}
 */
function verifyOtp(identifier, inputOtp) {
    const key = identifier.toLowerCase().trim();
    const record = otpStore.get(key);

    if (!record) {
        return {
            valid: false,
            message: 'Kode OTP tidak ditemukan atau sudah kadaluarsa. Silakan minta kode baru.'
        };
    }

    // Cek percobaan verifikasi
    if (record.attempts >= MAX_ATTEMPTS) {
        otpStore.del(key); // Hanguskan OTP
        return {
            valid: false,
            message: 'Batas maksimal 3 kali percobaan salah tercapai. Kode OTP telah dinonaktifkan demi keamanan.'
        };
    }

    // Hash input user dan bandingkan
    const inputHash = hashOtp(inputOtp.toString().trim(), record.salt);
    const isValid = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.hashedOtp));

    if (!isValid) {
        record.attempts += 1;
        const sisaPercobaan = MAX_ATTEMPTS - record.attempts;

        if (sisaPercobaan <= 0) {
            otpStore.del(key);
            return {
                valid: false,
                message: 'Kode OTP salah. Batas percobaan habis. Silakan minta kode OTP baru.'
            };
        } else {
            // Update jumlah attempt tersisa
            const remainingTtl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
            otpStore.set(key, record, remainingTtl);
            return {
                valid: false,
                message: `Kode OTP salah. Sisa percobaan: ${sisaPercobaan} kali.`
            };
        }
    }

    // JIKA VALID: HAPUS OTP LANGSUNG (SINGLE-USE ONLY)
    otpStore.del(key);

    return {
        valid: true,
        message: 'Verifikasi OTP berhasil.'
    };
}

module.exports = {
    generateOtp,
    verifyOtp
};
