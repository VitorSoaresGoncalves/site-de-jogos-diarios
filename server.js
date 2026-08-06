const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const termoRoutes = require('./routes/termo');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(
    session({
        secret: 'troque-essa-chave-depois',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// ⬇️ as rotas só podem vir DEPOIS da sessão
app.use('/api/auth', authRoutes);
app.use('/api/termo', termoRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});