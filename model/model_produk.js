const connection = require('../config/database_produk.js');
class model_produk {
    static async store(Data){
        return new Promise((resolve, reject) => {
            connection.query('INSERT INTO produk SET ?', Data, (err, result) => {
                if(err) reject(err);
                else resolve(result);
            });
        });
    }
    static async getAll(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM produk ORDER BY id_produk DESC', (err, rows) => {
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }
    static async getId(id){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM produk WHERE id_produk = ?', [id], (err, rows) => {
                if(err) reject(err);
                else resolve(rows[0]);
            });
        });
    }
    static async update(id, Data){
        return new Promise((resolve, reject) => {
            connection.query('UPDATE produk SET ? WHERE id_produk = ?', [Data, id], (err, result) => {
                if(err) reject(err);
                else resolve(result);
            });
        });
    }
    static async delete(id){
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM produk WHERE id_produk = ?', [id], (err, result) => {
                if(err) reject(err);
                else resolve(result);
            });
        });
    }
}
module.exports = model_produk;