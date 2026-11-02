const mysql = require('mysql2');

const db_mahasiswa = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_mahasiswa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db_mahasiswa;