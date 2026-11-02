const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Model_Users = require('../../model/Model_Users');
const { sendOtpNotification } = require('../../config/middleware/sendWhatsApp');
const { generateOtp, verifyOtp } = require('../../services/otpService');

/**
 * POST /auth/otp/request
 * Body: { email, phone }
 */
router.post('/request', async (req, res) => {
    const { email, phone } = req.body;

    if (!email || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Email dan nomor WhatsApp wajib disertakan.'
        });
    }

    try {
        const user = await Model_Users.getByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Pengguna dengan email tersebut tidak ditemukan.'
            });
        }

        const otpResult = generateOtp(email);
        if (!otpResult.success) {
            return res.status(429).json({
                success: false,
                message: otpResult.error,
                remainingCooldown: otpResult.remainingCooldown
            });
        }

        const sendResult = await sendOtpNotification({
            to: phone,
            otp: otpResult.otp,
            userName: user.email.split('@')[0],
            expiresInMinutes: otpResult.expiresInMinutes
        });

        if (!sendResult.success) {
            return res.status(502).json({
                success: false,
                message: 'Gagal mengirim WhatsApp OTP.',
                error: sendResult.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Kode OTP telah berhasil dikirimkan via WhatsApp.',
            simulated: !!sendResult.simulated,
            expiresInMinutes: otpResult.expiresInMinutes
        });

    } catch (err) {
        console.error('API OTP Request Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan internal server.',
            error: err.message
        });
    }
});

/**
 * POST /auth/otp/verify
 * Body: { email, otp, newPassword }
 */
router.post('/verify', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Email, OTP, dan newPassword wajib diisi.'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password baru minimal 6 karakter.'
        });
    }

    try {
        const verification = verifyOtp(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Model_Users.updatePasswordByEmail(email, hashedPassword);

        return res.status(200).json({
            success: true,
            message: 'Password berhasil direset. Silakan login kembali.'
        });

    } catch (err) {
        console.error('API OTP Verify Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat memperbarui password.',
            error: err.message
        });
    }
});

module.exports = router;
