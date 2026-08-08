const db = require('../../database/db');

function buscarPorNick(nick) {

    const stmt = db.prepare(`
        SELECT
        id,
        nome,
        nick,
        senha_hash
        FROM usuarios
        WHERE nick = ?
    `);

    return stmt.get(nick);

}

function buscarPorId(id) {

    const stmt = db.prepare(`
        SELECT *
        FROM usuarios
        WHERE id = ?
    `);

    return stmt.get(id);

}

function criar(nome, nick, senhaHash) {

    const stmt = db.prepare(`
        INSERT INTO usuarios (nome, nick, senha_hash)
        VALUES (?, ?, ?)
    `);

    return stmt.run(nome, nick, senhaHash);

}

module.exports = {
    buscarPorNick,
    buscarPorId,
    criar
};  