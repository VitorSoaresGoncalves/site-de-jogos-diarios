const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');

// CADASTRO
async function cadastro(req, res) {
    try {
        const { nome, nick, senha } = req.body;

        if (!nome || !nick || !senha) {
            return res.status(400).json({
                error: 'Preencha todos os campos.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        usuariosRepository.criar(
            nome,
            nick,
            senhaHash
        );

        return res.status(201).json({
            message: 'Conta criada com sucesso!'
        });

    } catch (error) {

        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
                error: 'Esse nick já está cadastrado.'
            });
        }

        return res.status(500).json({
            error: 'Erro ao criar conta.'
        });
    }
}

// LOGIN
async function login(req, res) {

    try {

        const { nick, senha } = req.body;

        const usuario =
            usuariosRepository.buscarPorNick(nick);

        if (!usuario) {
            return res.status(401).json({
                error: 'Nick ou senha inválidos.'
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                error: 'Nick ou senha inválidos.'
            });
        }

        req.session.usuarioId = usuario.id;
        req.session.usuarioNick = usuario.nick;

        return res.json({
            message: 'Login realizado!',
            nick: usuario.nick
        });

    } catch {

        return res.status(500).json({
            error: 'Erro ao fazer login.'
        });

    }

}

// LOGOUT
function logout(req, res) {

    req.session.destroy(() => {

        res.json({
            message: 'Sessão encerrada.'
        });

    });

}

// USUÁRIO ATUAL
function me(req, res) {

    if (!req.session.usuarioId) {

        return res.status(401).json({
            logado: false
        });

    }

    return res.json({
        logado: true,
        id: req.session.usuarioId,
        nick: req.session.usuarioNick
    });

}

module.exports = {
    cadastro,
    login,
    logout,
    me
};