function exigirLogin(req, res, next) {
    if (!req.session.usuarioId) {
        return res.status(401).json({ error: 'Você precisa estar logado.' });
    }
    next(); // deixa passar pra rota de verdade
}

module.exports = exigirLogin;