var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');

var Model_Users = require('../model/Model_Users');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/register', function(req, res, next) {
  res.render('auth/register');
});

router.get('/login', function(req, res, next) {
  res.render('auth/login');
});
router.post('/register', async function(req, res, next) {
    let { email, password } = req.body;
    try {
        let enkripsi = bcrypt.hashSync(password, 10);
        let data = {
            email,
            password: enkripsi
        }
        await Model_Users.store(data);
        req.flash('success', 'Data berhasil ditambahkan');
        res.redirect('/login');
    } catch (err) {
      console.log(err);
        req.flash('error', 'Gagal mendaftar');
        res.redirect('/register');
    }
});
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  try {
    let data = await Model_Users.login(email);
    if (data.length > 0) {
      let enkripsi = data[0].password;
      let cek = await bcrypt.compare(password, enkripsi);
      if (cek) {
        req.session.userId = data[0].id_users;
        req.flash('success', 'Berhasil login');
        req.session.user = data[0];
        res.redirect('/users');
      } else {
        req.flash('error', 'Email atau password salah');
        res.redirect('/login');
      }
    } else {
      req.flash('error', 'Akun tidak ditemukan');
      res.redirect('/login');
    }
  } catch (err) {
    req.flash('error', 'Error pada fungsi');
    res.redirect('/login');
  }
});
router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});
router.get('/change-password', async function(req, res) {
    try {
        let id = req.session.userId;
        console.log("SESSION ID:", req.session.userId);
        if (!id) {
            req.flash('error', 'login dulu');
            return res.redirect('/login');
        }

        let data = await Model_Users.getById(id);

        if (!data || data.length === 0) {
            req.flash('error', 'user tidak ditemukan');
            return res.redirect('/login');
        }

        return res.render('users/password', {
            email: data[0].email
        });

    } catch (err) {
        console.log(err);
        return res.status(500).send('error server');
    }
});
router.post('/change-password', async function(req, res) {
  try {
    let id = req.session.userId;
    let { oldPassword, newPassword } = req.body;

    console.log("BODY:", req.body);
    console.log("SESSION ID:", id);

    let data = await Model_Users.getById(id);

    let cek = await bcrypt.compare(oldPassword, data[0].password);

    if (!cek) {
      req.flash('error', 'password lama salah');
      return res.redirect('/change-password');
    }

    let hash = await bcrypt.hash(newPassword, 10);

    await Model_Users.update(id, { password: hash });

    req.flash('success', 'password berhasil diubah');
    return res.redirect('/users');

  } catch (err) {
    console.log(err);
    req.flash('error', 'error sistem');
    return res.redirect('/change-password');
  }
});

// ==========================================
// FITUR LUPA PASSWORD VIA WHATSAPP (WAHA)
// ==========================================
const { sendOtpNotification } = require('../config/middleware/sendWhatsApp');
const { generateOtp, verifyOtp } = require('../services/otpService');

// Halaman Minta OTP
router.get('/forgot-password', function(req, res) {
  res.render('auth/forgot-password');
});

// Proses Generate & Kirim OTP ke WhatsApp
router.post('/forgot-password', async function(req, res) {
  const { email, phone } = req.body;

  if (!email || !phone) {
    req.flash('error', 'Email dan nomor WhatsApp wajib diisi');
    return res.redirect('/forgot-password');
  }

  try {
    // 1. Validasi keberadaan user
    const user = await Model_Users.getByEmail(email);
    if (!user) {
      req.flash('error', 'Email tidak terdaftar dalam sistem.');
      return res.redirect('/forgot-password');
    }

    // 2. Generate OTP (terenkripsi SHA-256) & terapkan cooldown
    const otpResult = generateOtp(email);
    if (!otpResult.success) {
      req.flash('error', otpResult.error);
      return res.redirect('/forgot-password');
    }

    // 3. Kirim OTP ke WhatsApp via WAHA / Simulator
    const sendResult = await sendOtpNotification({
      to: phone,
      otp: otpResult.otp,
      userName: user.email.split('@')[0],
      expiresInMinutes: otpResult.expiresInMinutes
    });

    if (!sendResult.success) {
      req.flash('error', `Gagal mengirim WhatsApp: ${sendResult.error || 'Server WhatsApp offline'}`);
      return res.redirect('/forgot-password');
    }

    const simNote = sendResult.simulated ? ' [SIMULASI: Cek terminal server]' : '';
    req.flash('success', `Kode OTP telah dikirimkan ke WhatsApp Anda (${phone}). Berlaku 5 menit.${simNote}`);
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);

  } catch (err) {
    console.error('Error saat forgot-password:', err);
    req.flash('error', 'Terjadi kesalahan pada sistem saat memproses OTP.');
    return res.redirect('/forgot-password');
  }
});

// Halaman Verifikasi OTP & Reset Password
router.get('/verify-otp', function(req, res) {
  const email = req.query.email || '';
  const phone = req.query.phone || '';
  if (!email) {
    req.flash('error', 'Silakan masukkan email terlebih dahulu.');
    return res.redirect('/forgot-password');
  }
  res.render('auth/verify-otp', { email, phone });
});

// Proses Validasi OTP & Update Password Baru
router.post('/verify-otp', async function(req, res) {
  const { email, phone, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    req.flash('error', 'Semua kolom wajib diisi');
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
  }

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Konfirmasi password baru tidak cocok');
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
  }

  if (newPassword.length < 6) {
    req.flash('error', 'Password baru minimal harus 6 karakter');
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
  }

  try {
    // 1. Verifikasi OTP (cek hash, batas 3 percobaan, dan hapus jika valid)
    const verification = verifyOtp(email, otp);
    if (!verification.valid) {
      req.flash('error', verification.message);
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
    }

    // 2. Hash password baru & simpan ke DB
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Model_Users.updatePasswordByEmail(email, hashedPassword);

    req.flash('success', 'Password berhasil direset! Silakan masuk dengan password baru Anda.');
    return res.redirect('/login');

  } catch (err) {
    console.error('Error saat verifikasi OTP:', err);
    req.flash('error', 'Gagal mereset password.');
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
  }
});

module.exports = router;