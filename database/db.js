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

module.exports = db;
