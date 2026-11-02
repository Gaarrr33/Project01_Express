const connection = require('../config/database');

class model_kategori {

    static async store(data){
        return new Promise((resolve, reject) => {
            connection.query('insert into kategory set ?',data, function(err, result) {
                if (err){
                    reject(err);
                }else{
                    resolve(result);
                }
            })
        })
    }
    static async getAll(){
        return new Promise((resolve, reject) => {
            connection.query('select * from kategory order by id_kategori desc', (err, rows) => {
                if (err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            })
        })
    }
    static async getId(id){
        return new Promise((resolve, reject) => {
            connection.query('select * from kategory order by id_kategori desc', (err, rows) => {
                if (err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            })
        })
    }
    static async Update(id, data) {
    return new Promise((resolve, reject) => {
        connection.query('update kategory set ? where id_kategori = ' + id, data, function(err, result){
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
    static async delete(id) {
    return new Promise((resolve, reject) => {
        connection.query('delete from kategory where id_kategori = ' + id, function(err, result){
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
}
module.exports = model_kategori;