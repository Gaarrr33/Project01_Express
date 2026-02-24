var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('mbg', {
    judul: 'GIBRUN'
  })
})

module.exports = router;
