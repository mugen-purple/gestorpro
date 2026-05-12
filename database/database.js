const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const banco = new Database('./database/banco.db');

banco.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        nome TEXT,
        telefone TEXT,
        observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS ordens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        cliente TEXT,
        descricao TEXT,
        valor TEXT,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        senha TEXT,
        status TEXT DEFAULT 'pendente',
        tipo TEXT DEFAULT 'cliente'
    );
`);

const admin = banco
    .prepare('SELECT * FROM usuarios WHERE email = ?')
    .get('davi.andrade.210907@gmail.com');

if(!admin){

    const hash = bcrypt.hashSync('Tanjiro07*', 10);

    banco.prepare(`
        INSERT INTO usuarios
        (email, senha, status, tipo)
        VALUES (?, ?, ?, ?)
    `).run(
        'davi.andrade.210907@gmail.com',
        hash,
        'ativo',
        'admin'
    );

}

const db = {
    all(sql, params = [], callback){
        try{
            const rows = banco.prepare(sql).all(...params);
            callback(null, rows);
        } catch(err){
            callback(err);
        }
    },

    get(sql, params = [], callback){
        try{
            const row = banco.prepare(sql).get(...params);
            callback(null, row);
        } catch(err){
            callback(err);
        }
    },

    run(sql, params = [], callback){
        try{
            const result = banco.prepare(sql).run(...params);

            if(callback){
                callback(null, result);
            }
        } catch(err){
            if(callback){
                callback(err);
            }
        }
    }
};

module.exports = db;