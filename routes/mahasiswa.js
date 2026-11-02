const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const multer = require('multer');
const path = require('path');

// upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// INDEX
router.get('/', (req, res) => {
    db.query('SELECT * FROM mahasiswa', (err, results) => {
        if (err) throw err;
        res.render('biodata/index', { data: results });
    });
});

// CREATE
router.get('/create', (req, res) => {
    res.render('biodata/create');
});

// STORE
router.post('/store', upload.single('foto'), (req, res) => {
    const { nrp, nama, jenis_kelamin } = req.body;
    const foto = req.file ? req.file.filename : null;
    const sql = 'INSERT INTO mahasiswa (nrp, nama, jenis_kelamin, foto) VALUES (?, ?, ?, ?)';
    db.query(sql, [nrp, nama, jenis_kelamin, foto], err => {
        if (err) throw err;
        res.redirect('/biodata');
    });
});

// EDIT
router.get('/edit/:id', (req, res) => {
    db.query('SELECT * FROM mahasiswa WHERE id_mahasiswa = ?', [req.params.id], (err, results) => {
        if (err) throw err;
        res.render('biodata/edit', { data: results[0] });
    });
});

// UPDATE
router.post('/update/:id', upload.single('foto'), (req, res) => {
    const { nrp, nama, jenis_kelamin } = req.body;
    let sql, params;
    if (req.file) {
        sql = 'UPDATE mahasiswa SET nrp=?, nama=?, jenis_kelamin=?, foto=? WHERE id_mahasiswa=?';
        params = [nrp, nama, jenis_kelamin, req.file.filename, req.params.id];
    } else {
        sql = 'UPDATE mahasiswa SET nrp=?, nama=?, jenis_kelamin=? WHERE id_mahasiswa=?';
        params = [nrp, nama, jenis_kelamin, req.params.id];
    }
    db.query(sql, params, err => {
        if (err) throw err;
        res.redirect('/biodata');
    });
});

// DELETE
router.get('/delete/:id', (req, res) => {
    db.query('DELETE FROM mahasiswa WHERE id_mahasiswa=?', [req.params.id], err => {
        if (err) throw err;
        res.redirect('/biodata');
    });
});

module.exports = router;