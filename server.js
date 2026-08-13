require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const sharedSession = require('express-socket.io-session');
const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./database/db');
const authRoutes = require('./routes/auth');
const termoRoutes = require('./routes/termo');
const conexoRoutes = require('./routes/conexo');
const { registrarEventosSocket } = require('./sockets/conexaoJogadores');

const app = express();
const servidorHttp = http.createServer(app);
const io = new Server(servidorHttp);
const PORT = process.env.PORT || 3000;

const configuracaoSessao = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production'
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(configuracaoSessao);

io.use(sharedSession(configuracaoSessao, { autoSave: true }));

io.on('connection', (socket) => {
    
    registrarEventosSocket(io, socket);
});

app.use('/api/auth', authRoutes);
app.use('/api/termo', termoRoutes);
app.use('/api/conexo', conexoRoutes);

servidorHttp.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});