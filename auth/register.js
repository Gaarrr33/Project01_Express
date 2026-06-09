var express = require('express');
var router = express.Router();

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    try {
        const existingUser = await Model_Users.getByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email sudah digunakan' });
        }

        await Model_Users.registerUser(email, password);
        res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (err) {
        res.status(500).json({ message: 'Terjadi kesalahan', error: err });
    }
});

module.exports = router;