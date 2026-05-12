const bcrypt = require('bcrypt');
const db = require('./database/database');
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.use(session({

    secret: 'sistema-secreto',

    resave: false,

    saveUninitialized: false

}));

function verificarLogin(req, res, next){

    if(req.session.usuario){

        next();

    } else {

        res.redirect('/');

    }

}

function verificarAdmin(req, res, next){

    if(req.session.usuario && req.session.usuario.tipo === 'admin'){

        next();

    } else {

        res.send('Acesso negado.');

    }

}

// LOGIN

app.get('/', (req, res) => {

    res.render('login');

});

app.post('/login', (req, res) => {

    const { email, senha } = req.body;

    db.get(
        'SELECT * FROM usuarios WHERE email = ?',
        [email],
        (err, row) => {

            if(err){
                console.log(err);
                return res.send('Erro no servidor.');
            }

            if(!row){
                return res.send('E-mail ou senha inválidos.');
            }

            bcrypt.compare(senha, row.senha, (err, resultado) => {

                if(err){
                    console.log(err);
                    return res.send('Erro ao validar senha.');
                }

                if(!resultado){
                    return res.send('E-mail ou senha inválidos.');
                }

                if(row.status !== 'ativo'){
                    return res.send('Sua conta ainda não foi ativada.');
                }

                req.session.usuario = row;

                res.redirect('/dashboard');

            });

        }
    );

});
// DASHBOARD

app.get('/dashboard', verificarLogin, (req, res) => {

    db.all(
        'SELECT * FROM clientes',
        [],
        (err, rowsClientes) => {

            if(err){
                console.log(err);
                return;
            }

            db.all(
                'SELECT * FROM ordens',
                [],
                (err, rowsOrdens) => {

                    if(err){
                        console.log(err);
                        return;
                    }

                    const abertas = rowsOrdens.filter(
                        ordem => ordem.status !== 'Finalizado'
                    ).length;

                    const finalizadas = rowsOrdens.filter(
                        ordem => ordem.status === 'Finalizado'
                    ).length;

                    let total = 0;

                    rowsOrdens.forEach(ordem => {

                        total += Number(ordem.valor);

                    });

                    res.render('dashboard', {

                        clientes: rowsClientes.length,

                        abertas,

                        finalizadas,

                        total,
                        
                        usuario: req.session.usuario 
                    });

                }
            );

        }
    );

});

// CLIENTES

app.get('/clientes', verificarLogin, (req, res) => {

    db.all('SELECT * FROM clientes WHERE usuario_id = ?', [req.session.usuario.id], (err, rows) => {

        if(err){
            console.log(err);
        } else {

            res.render('clientes', {
                clientes: rows,
                usuario: req.session.usuario
            });

        }

    });

});

app.post('/salvar-cliente', (req, res) => {

    const usuario_id = req.session.usuario.id;

    const { nome, telefone, observacoes } = req.body;

    db.run(
          `INSERT INTO clientes
    (usuario_id, nome, telefone, observacoes)
    VALUES (?, ?, ?, ?)`,
        [usuario_id, nome, telefone, observacoes],
        (err) => {

            if(err){
                console.log(err);
            } else {
                console.log('Cliente salvo!');
            }

            res.redirect('/clientes');

        }
    );

});

app.post('/deletar-cliente/:id', (req, res) => {

    const id = req.params.id;

    db.run(
        'DELETE FROM clientes WHERE id = ?',
        [id],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/clientes');

        }
    );

});

app.get('/editar-cliente/:id', (req, res) => {

    const id = req.params.id;

    db.get(
        'SELECT * FROM clientes WHERE id = ?',
        [id],
        (err, row) => {

            if(err){
                console.log(err);
            } else {

                res.render('editar-cliente', {
                    cliente: row
                });

            }

        }
    );

});

app.post('/atualizar-cliente/:id', (req, res) => {

    const id = req.params.id;

    const { nome, telefone, observacoes } = req.body;

    db.run(
        `UPDATE clientes
         SET nome = ?, telefone = ?, observacoes = ?
         WHERE id = ?`,
        [nome, telefone, observacoes, id],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/clientes');

        }
    );

});

// ORDENS

app.get('/ordens', verificarLogin, (req, res) => {

    db.all(
        'SELECT * FROM ordens WHERE usuario_id = ?',
        [req.session.usuario.id],
        (err, ordens) => {

            if(err){
                console.log(err);
                return;
            }

            db.all(
                'SELECT * FROM clientes',
                [],
                (err, clientes) => {

                    if(err){
                        console.log(err);
                    } else {

                        res.render('ordens', {
                            ordens,
                            clientes,
                            usuario: req.session.usuario
                        });

                    }

                }
            );

        }
    );

});

app.post('/salvar-ordem', (req, res) => {
    const usuario_id = req.session.usuario.id;
    const {
        cliente,
        descricao,
        valor,
        status
    } = req.body;

    db.run(
        `INSERT INTO ordens
(usuario_id, cliente, descricao, valor, status)
VALUES (?, ?, ?, ?, ?)`,
        [usuario_id, cliente, descricao, valor, status],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/ordens');

        }
    );

});

app.post('/atualizar-status/:id', (req, res) => {

    const id = req.params.id;

    const { status } = req.body;

    db.run(
        'UPDATE ordens SET status = ? WHERE id = ?',
        [status, id],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/ordens');

        }
    );

});

app.post('/deletar-ordem/:id', (req, res) => {

    const id = req.params.id;

    db.run(
        'DELETE FROM ordens WHERE id = ?',
        [id],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/ordens');

        }
    );

});

// FINANCEIRO

app.get('/financeiro', verificarLogin, (req, res) => {

    db.all(
        'SELECT * FROM ordens',
        [],
        (err, ordens) => {

            if(err){
                console.log(err);
                return;
            }

            let faturamento = 0;
            let pendente = 0;

            const finalizadas = ordens.filter(
                ordem => ordem.status === 'Finalizado'
            ).length;

            ordens.forEach(ordem => {

                const valor = Number(ordem.valor);

                if(ordem.status === 'Finalizado'){

                    faturamento += valor;

                } else {

                    pendente += valor;

                }

            });

            res.render('financeiro', {

                faturamento,

                pendente,

                finalizadas,

                ordens,

                usuario: req.session.usuario

            });

        }
    );

});

app.get('/logout', (req, res) => {

    req.session.destroy(() => {

        res.redirect('/');

    });

});

app.get('/registro', (req, res) => {
    res.render('registro');
});

app.post('/registro', (req, res) => {

    const { email, senha, confirmar } = req.body;

    if(!email || !senha || !confirmar){
        return res.send('Preencha todos os campos.');
    }

    if(senha !== confirmar){
        return res.send('As senhas não coincidem.');
    }

    bcrypt.hash(senha, 10, (err, hash) => {

        if(err){
            console.log(err);
            return res.send('Erro ao criptografar senha.');
        }

        db.run(
            `INSERT INTO usuarios
            (email, senha, status, tipo)
            VALUES (?, ?, ?, ?)`,
            [email, hash, 'pendente', 'cliente'],
            (err) => {

                if(err){
                    console.log(err);
                    return res.send('Esse e-mail já está cadastrado.');
                }

                res.send('Conta criada! Aguarde a ativação pelo administrador.');

            }
        );

    });

});

app.get(
    '/usuarios',
    verificarLogin,
    verificarAdmin,
    (req, res) => {

        db.all(
            'SELECT * FROM usuarios',
            [],
            (err, usuarios) => {

                if(err){
                    console.log(err);
                    return;
                }

                res.render('usuarios', {

                    usuarios,

                    usuario: req.session.usuario

                });

            }
        );

    }
);

app.post('/ativar-usuario/:id', (req, res) => {

    const id = req.params.id;

    db.run(
        `UPDATE usuarios
         SET status = 'ativo'
         WHERE id = ?`,
        [id],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/usuarios');

        }
    );

});

app.post('/bloquear-usuario/:id', (req, res) => {

    const id = req.params.id;

    db.run(
        `UPDATE usuarios
         SET status = 'bloqueado'
         WHERE id = ?`,
        [id],
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect('/usuarios');

        }
    );

});

app.listen(3000, () => {

    console.log('Servidor rodando em http://localhost:3000!');

});
