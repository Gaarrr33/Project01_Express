const express = require('express');
const router = express.Router();
const model_produk = require('../../model/model_produk');
const multer = require('multer');
const path = require('path');

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
        res.status(200).json({ 
            produk: data });
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
        res.status(201).json({ 
            message: 'Produk added successfully' });
    } catch(err) {
        console.log(err);
        res.send('Error saving produk: ' + err.message);
    }
});
// Form edit
router.get('/edit/:id', async (req, res) => {
    try {
        const produk = await model_produk.getId(req.params.id);
        res.status(200).json({ 
            produk });
    } catch(err) {
        console.log(err);
        res.send('Error loading produk: ' + err.message);
    }
});
// Update produk
router.post('/update/:id', upload.single('foto'), async (req, res) => {
    try {
        const { nama_produk, harga } = req.body;
        let dataUpdate = { nama_produk, harga };
        if(req.file) dataUpdate.foto = req.file.filename;

        await model_produk.update(req.params.id, dataUpdate);
        res.status(200).json({ 
            message: 'Produk updated successfully' });
    } catch(err) {
        console.log(err);
        res.send('Error updating produk: ' + err.message);
    }
});
// Hapus produk
router.get('/delete/:id', async (req, res) => {
    try {
        await model_produk.delete(req.params.id);
        res.status(200).json({ 
            message: 'Produk deleted successfully' });
    } catch(err) {
        console.log(err);
        res.send('Error deleting produk: ' + err.message);
    }
});

module.exports = router;