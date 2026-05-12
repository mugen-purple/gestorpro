const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./database/banco.db');

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    nome TEXT,
    telefone TEXT,
    observacoes TEXT
)
        
    `);
     
    db.run(`
    CREATE TABLE IF NOT EXISTS ordens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    cliente TEXT,
    descricao TEXT,
    valor TEXT,
    status TEXT
)
`);
   
 db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        senha TEXT,
        status TEXT DEFAULT 'pendente',
        tipo TEXT DEFAULT 'cliente'
    )
`);
db.get(
    'SELECT * FROM usuarios WHERE email = ?',
    ['davi.andrade.210907@gmail.com'],
    (err, row) => {

        if(err){
            console.log(err);
            return;
        }

        if(!row){

            bcrypt.hash('Tanjiro07*', 10, (err, hash) => {

                if(err){
                    console.log(err);
                    return;
                }

                db.run(
                    `INSERT INTO usuarios
                    (email, senha, status, tipo)
                    VALUES (?, ?, ?, ?)`,
                    [
                        'davi.andrade.210907@gmail.com',
                        hash,
                        'ativo',
                        'admin'
                    ]
                );

            });

        }

    }
);
});
module.exports = db;