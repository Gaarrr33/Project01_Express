const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 7 * 60 * 1000,
    max: 3,
    message: {
        status: 429,
        message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 7 menit.'
    }
});

module.exports = loginLimiter;