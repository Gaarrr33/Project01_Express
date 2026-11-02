var express = require('express');
var router = express.Router();
const Model_Users = require('../model/Model_Users');
const bcrypt = require('bcrypt');

/* GET users listing. */
router.get('/', async function(req, res, next) {
    try {
        let id = req.session.userId;
        let data = await Model_Users.getById(id);
        if (data.length > 0) {
            res.render('users/index', {
                title: 'Users home',
                user: data[0],
            });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('butuh akses login');
    }
});
module.exports = router;