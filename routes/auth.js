const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../database/db');
const exigirLogin = require('../middleware/auth');

// CADASTRO
router.post('/cadastro', async (req, res) => {
    try {

        const { nome, nick, senha } = req.body;

        if (!nome || !nick || !senha) {
            return res.status(400).json({ error: 'Preencha todos os campos.' });
        }

        // Gera o hash da senha (o "10" é o custo do processamento - padrão seguro)
        const senhaHash = await bcrypt.hash(senha, 10);

        const inserir = db.prepare(`
            INSERT INTO usuarios (nome, nick, senha_hash)
            VALUES (?, ?, ?)
        `);
        inserir.run(nome, nick, senhaHash);

        res.status(201).json({ message: 'Conta criada com sucesso!' });

    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Esse nick já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro ao criar conta.' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { nick, senha } = req.body;

        const buscarUsuario = db.prepare(
            'SELECT * FROM usuarios WHERE nick = ?'
        );
        const usuario = buscarUsuario.get(nick);

        if (!usuario) {
            return res.status(401).json({ error: 'Nick ou senha inválidos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Nick ou senha inválidos.' });
        }

        // Salva o usuário na sessão
        req.session.usuarioId = usuario.id;
        req.session.usuarioNick = usuario.nick;

        res.json({
            message: 'Login realizado!',
            nick: usuario.nick
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Sessão encerrada.' });
    });
});


// VERIFICAR SESSÃO ATUAL
router.get('/me', (req, res) => {
    if (!req.session.usuarioId) {
        return res.status(401).json({
            logado: false
        });
    }

    res.json({
        logado: true,
        id: req.session.usuarioId,
        nick: req.session.usuarioNick
    });
});



module.exports = router;