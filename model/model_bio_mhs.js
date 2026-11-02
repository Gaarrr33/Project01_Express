const db = require('../config/db');

const Mahasiswa = {
  getAll: (callback) => {
    db.query('SELECT * FROM mahasiswa', callback);
  },

  getById: (id, callback) => {
    db.query('SELECT * FROM mahasiswa WHERE id_mahasiswa=?', [id], callback);
  },

  create: (data, callback) => {
    const { nrp, nama, jenis_kelamin, foto } = data;
    db.query(
      'INSERT INTO mahasiswa (nrp, nama, jenis_kelamin, foto) VALUES (?, ?, ?, ?)',
      [nrp, nama, jenis_kelamin, foto],
      callback
    );
  },

  update: (id, data, callback) => {
    const { nrp, nama, jenis_kelamin, foto } = data;
    let sql, params;
    if(foto){
      sql = 'UPDATE mahasiswa SET nrp=?, nama=?, jenis_kelamin=?, foto=? WHERE id_mahasiswa=?';
      params = [nrp, nama, jenis_kelamin, foto, id];
    } else {
      sql = 'UPDATE mahasiswa SET nrp=?, nama=?, jenis_kelamin=? WHERE id_mahasiswa=?';
      params = [nrp, nama, jenis_kelamin, id];
    }
    db.query(sql, params, callback);
  },

  delete: (id, callback) => {
    db.query('DELETE FROM mahasiswa WHERE id_mahasiswa=?', [id], callback);
  }
};

module.exports = Mahasiswa;