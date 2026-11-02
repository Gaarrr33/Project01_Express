const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mahasiswa' 
});

connection.connect((err) => {
    if (err) console.error('Koneksi gagal:', err);
    else console.log('MySQL nyambung');
});

module.exports = connection;