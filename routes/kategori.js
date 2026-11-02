var express = require('express');
const connection = require('../config/database');
const model_kategori = require('../model/model_kategori')
const verifyToken = require('../config/middleware/jwt.js');
var router = express.Router();

router.get('/', async function(req, res, next){
    let rows = await model_kategori.getAll();
        res.render('kategori/index',{
        judul : 'Halaman kategori',
        data: rows
      });
});
router.get('/create', function(req, res, next) {
    res.render('kategori/create', {
        nama_kategori: ''
    });
});
router.post('/store', async function(req, res, next) {
    try {
        let { nama_kategori } = req.body;
        let Data = {
            nama_kategori
        }
        await model_kategori.store(Data);
         req.flash('success', 'Berhasil menyimpan data!');
          res.redirect('/kategori');
    } catch (err) {
        req.flash('error', 'Terjadi kesalahan pada fungsi');
        res.redirect('/kategori');
    }
});
router.get('/edit/:id', async function(req, res, next) {
    let id = req.params.id;
    let rows = await model_kategori.getId(id)
     res.render('kategori/edit', {
                id: rows[0].id_kategori,
                nama_kategori: rows[0].nama_kategori
            });
});

router.post('/update/:id',async function(req, res, next) {
    let id = req.params.id;
    let nama_kategori = req.body.nama_kategori;
    let errors = false;

    if (!errors) {
        let Data = {
            nama_kategori: nama_kategori
        }
        await model_kategori.Update(id, Data);
        req.flash('success', 'Data Berhasil Diupdate!');
                res.redirect('/kategori');
    }
});
router.get('/delete/(:id)',async function(req, res, next) {
    let id = req.params.id;
    await model_kategori.delete(id);
    req.flash('success', 'Data Berhasil Dihapus!');
    res.redirect('/kategori');
        
});
module.exports = router;
