const express = require('express');
const router = express.Router();
const model_produk = require('../model/model_produk');
const multer = require('multer');
const path = require('path');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
// List produk
router.get('/', async (req, res) => {
    try {
        const data = await model_produk.getAll();
        res.render('produk/index', { produk: data });
    } catch(err) {
        console.log(err);
        res.send('Error loading produk: ' + err.message);
    }
});
// Form tambah
router.get('/create', (req, res) => {
    res.render('produk/create');
});
// Simpan produk
router.post('/create', upload.single('foto'), async (req, res) => {
    try {
        const { nama_produk, harga } = req.body;
        const foto = req.file ? req.file.filename : null;

        await model_produk.store({ nama_produk, harga, foto });
        res.redirect('/produk');
    } catch(err) {
        console.log(err);
        res.send('Error saving produk: ' + err.message);
    }
});
// Form edit
router.get('/edit/:id', async (req, res) => {
    try {
        const produk = await model_produk.getId(req.params.id);
        res.render('produk/edit', { produk });
    } catch(err) {
        console.log(err);
        res.send('Error loading produk: ' + err.message);
    }
});
// Update produk
router.post('/edit/:id', upload.single('foto'), async (req, res) => {
    try {
        const { nama_produk, harga } = req.body;
        let dataUpdate = { nama_produk, harga };
        if(req.file) dataUpdate.foto = req.file.filename;

        await model_produk.update(req.params.id, dataUpdate);
        res.redirect('/produk');
    } catch(err) {
        console.log(err);
        res.send('Error updating produk: ' + err.message);
    }
});
// Hapus produk
router.get('/delete/:id', async (req, res) => {
    try {
        await model_produk.delete(req.params.id);
        res.redirect('/produk');
    } catch(err) {
        console.log(err);
        res.send('Error deleting produk: ' + err.message);
    }
});
router.get('/', async function(req, res, next){
    let id = req.params.id;
    let rows = await Model_Produk.getAll();
    return res.status(200).json({
        status: true,
        message: 'Data Produk',
        data: rows
    })
});
module.exports = router;