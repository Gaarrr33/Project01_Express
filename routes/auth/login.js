var express = require('express');
var router = express.Router();
const Model_Users = require('../../model/Model_Users');
const loginLimiter = require('../../config/middleware/ratelimiter');

router.post('/', loginLimiter, async function(req, res, next) {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Username dan password harus diisi'
        });
    }

    try {
        const result = await Model_Users.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: 'terjadi kesalahan'
        });
    }
});

module.exports = router;