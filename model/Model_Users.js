const connection = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
class Model_Users {
static async getAll(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users', (err, rows) => {
                if (err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            })
        })
    }
    static async store(data){
        return new Promise((resolve, reject) => {
            connection.query('INSERT INTO users SET ?',data, (err, rows) => {
                if (err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            })
        })
    }
    static async login(email){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users WHERE email = ?',[email],(err, rows) => {
                if (err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            })
        })
    }
    static async update(id, data) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE users SET ? WHERE id_users = ? ',[data, id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
    static async delete(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM users WHERE id_users = ?',[id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
static async getById(id){
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE id_users = ?', [id], (err, rows) => {
            if (err){
                reject(err);
            }else{
                resolve(rows);
            }
        });
    });
}
static async updatePasswordByEmail(email, hashedPassword){
    return new Promise((resolve, reject) => {
        connection.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, result) => {
            if (err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    });
}
static async getByEmail(email){
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
            if (err){
                reject(err);
            }else{
                resolve(rows[0]);
            }
        })
    })
}
static async registerUser(email,password){
    return new Promise(async (resolve,reject) => {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            connection.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        } catch (error) {
            reject(error);
        }
    })
}
static async login(email,password) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users where email = ?';
        connection.query(sql, [email], async (err, results) => {
            if(err) return reject({status: 500, message: 'error pada server'});
            if(results.length === 0){
                return reject({status: 404, message: 'email tidak ditemukan'});
            }
            const user = results[0];
            const isPasswordValid = bcrypt.compare(password, user.password);
            if (isPasswordValid){
                return reject(401, 'password salah');
            }
            const token = jwt.sign({
                id_users: use,
                email: user.email,
            }, process.env.JWT_SECRET, {
                expiresIn: '1h' }
        );
            resolve({ token });
        })
})
}
}
module.exports = Model_Users