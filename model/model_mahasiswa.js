const db = require('../config/database_mahasiswa');

class model_mahasiswa {
    static async getAll(){
        return new Promise((resolve, reject) => {
            db.query("SELECT * FROM mahasiswa", (err, rows) => {
                if(err) return reject(err);
                resolve(rows);
            });
        });
    }

    static async store(data){
        return new Promise((resolve, reject) => {
            db.query("INSERT INTO mahasiswa SET ?", data, (err, result) => {
                if(err) return reject(err);
                resolve(result);
            });
        });
    }
}

module.exports = model_mahasiswa;