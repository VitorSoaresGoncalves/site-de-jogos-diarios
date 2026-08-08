const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jogos.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        nick TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS conexo_customizado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        criador_id INTEGER,
        criador_nome TEXT,
        tamanho INTEGER NOT NULL,
        grupos TEXT NOT NULL,
        privado INTEGER NOT NULL DEFAULT 0,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (criador_id) REFERENCES usuarios(id)
    )
`);

// Migração: adiciona a coluna 'privado' se o banco já existia sem ela
try {
    db.exec(`ALTER TABLE conexo_customizado ADD COLUMN privado INTEGER NOT NULL DEFAULT 0`);
} catch (error) {
    // Erro esperado se a coluna já existir — ignoramos silenciosamente
}

module.exports = db;
