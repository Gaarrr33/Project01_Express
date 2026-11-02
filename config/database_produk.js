const mysql = require('mysql2');

const produk = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'produk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = produk;