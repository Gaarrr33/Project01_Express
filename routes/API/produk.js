const express = require('express');
const router = express.Router();
const model_produk = require('../../model/model_produk');
const multer = require('multer');
const path = require('path');

const compressionMiddleware = require('../../config/middleware/compressionMiddleware');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', compressionMiddleware, async (req, res) => {
    try {
        const data = await model_produk.getAll();

        res.status(200).json({
            produk: data
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: 'Error loading produk',
            error: err.message
        });
    }
});

router.get('/create', (req, res) => {
    res.status(200).json({
        message: 'Create produk form endpoint'
    });
});

router.post('/create', upload.single('foto'), async (req, res) => {
    try {
        const { nama_produk, harga } = req.body;
        const foto = req.file ? req.file.filename : null;

        await model_produk.store({
            nama_produk,
            harga,
            foto
        });

        res.status(201).json({
            message: 'Produk added successfully'
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: 'Error saving produk',
            error: err.message
        });
    }
});

router.get('/edit/:id', async (req, res) => {
    try {
        const produk = await model_produk.getId(req.params.id);

        res.status(200).json({
            produk
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: 'Error loading produk',
            error: err.message
        });
    }
});

router.post('/update/:id', upload.single('foto'), async (req, res) => {
    try {
        const { nama_produk, harga } = req.body;

        let dataUpdate = {
            nama_produk,
            harga
        };

        if (req.file) {
            dataUpdate.foto = req.file.filename;
        }

        await model_produk.update(req.params.id, dataUpdate);

        res.status(200).json({
            message: 'Produk updated successfully'
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: 'Error updating produk',
            error: err.message
        });
    }
});

router.get('/delete/:id', async (req, res) => {
    try {
        await model_produk.delete(req.params.id);

        res.status(200).json({
            message: 'Produk deleted successfully'
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: 'Error deleting produk',
            error: err.message
        });
    }
});

module.exports = router;