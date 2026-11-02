var express = require('express');
const model_kategori = require('../../model/model_kategori');
const model_users = require('../../model/Model_Users');
var router = express.Router();
var verifyToken = require('../../config/middleware/jwt.js');
router.get('/', async function(req, res, next){
    let rows = await model_kategori.getAll();
       return res.status(200).json({
        status: true,
        messages : 'Data kategori',
        data: rows
      });
})
router.get('/create', function(req, res, next) {
    res.render('kategori/create', {
        nama_kategori: ''
    });
});
router.post('/store', async function(req, res, next){
    try {
        let nama_kategori = req.body.nama_kategori;
        await model_kategori.Store(nama_kategori);
        return res.status(201).json({
            status: "success",
            message: 'Data berhasil ditambahkan'
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: 'Terjadi kesalahan pada router'
        });
    }
});
router.get('/edit/:id', async function(req, res, next) {
    let id = req.params.id;
    let rows = await model_kategori.getId(id)
     res.status(200).json({
        status: true,
        messages : 'Data kategori',
        data: rows[0]
      });
});
router.post('/update/:id', async function(req, res, next){
    try {
        let id = req.params.id;
        let {nama_kategori} = req.body;
        let data = {nama_kategori: nama_kategori}
        await model_kategori.Update(id, data);
        return res.status(201).json({
            status: true,
            message: 'Data kategori berhasil di perbarui'
        });
    } catch (error) {
        return res.status(500).json({
            status: true,
            message: 'Terjadi kesalahan pada router'
        });
    }
});
router.get('/delete/(:id)',async function(req, res, next) {
    let id = req.params.id;
    await model_kategori.delete(id);
    return res.status(200).json({
        status: true,
        messages: 'Data kategori berhasil dihapus'
    });
});
module.exports = router;
