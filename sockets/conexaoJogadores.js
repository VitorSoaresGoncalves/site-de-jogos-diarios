const db = require('../database/db');

const socketsPorUsuario = new Map();
const parceirosConectados = new Map();

function buscarUsuarioPorNick(nick) {
    return db.prepare('SELECT id, nome, nick FROM usuarios WHERE nick = ?').get(nick);
}

function buscarUsuarioPorId(id) {
    return db.prepare('SELECT id, nome, nick FROM usuarios WHERE id = ?').get(id);
}

function nomeDaSala(idA, idB) {
    return `dupla-${[idA, idB].sort((a, b) => a - b).join('-')}`;
}

function registrarEventosSocket(io, socket) {
    const sessao = socket.handshake.session;

    if (!sessao || !sessao.usuarioId) {
        return;
    }

    const meuId = sessao.usuarioId;
    const meuNick = sessao.usuarioNick;

    socketsPorUsuario.set(meuId, socket.id);
    socket.data.usuarioId = meuId;
    socket.data.usuarioNick = meuNick;

    if (parceirosConectados.has(meuId)) {
        const parceiroId = parceirosConectados.get(meuId);
        socket.join(nomeDaSala(meuId, parceiroId));
    }

    // ===== Convite =====
    socket.on('convite:enviar', ({ nickDestino }) => {
        const destino = buscarUsuarioPorNick(nickDestino);

        if (!destino) {
            socket.emit('convite:erro', { mensagem: 'Usuário não encontrado.' });
            return;
        }

        if (destino.id === meuId) {
            socket.emit('convite:erro', { mensagem: 'Você não pode se conectar consigo mesmo.' });
            return;
        }

        const socketDestinoId = socketsPorUsuario.get(destino.id);

        if (!socketDestinoId) {
            socket.emit('convite:erro', { mensagem: 'Esse jogador não está online.' });
            return;
        }
        

        io.to(socketDestinoId).emit('convite:recebido', {
            deId: meuId,
            deNick: meuNick
        });

        socket.emit('convite:enviado', { paraNick: destino.nick });
    });

    socket.on('convite:responder', ({ deId, aceitar }) => {
        const socketOrigemId = socketsPorUsuario.get(deId);

        if (aceitar) {
            parceirosConectados.set(meuId, deId);
            parceirosConectados.set(deId, meuId);

            const sala = nomeDaSala(meuId, deId);
            socket.join(sala);
            if (socketOrigemId) io.sockets.sockets.get(socketOrigemId)?.join(sala);

            const origem = buscarUsuarioPorId(deId);

            io.to(sala).emit('conexao:estabelecida', {
                jogadores: [
                    { id: meuId, nick: meuNick },
                    { id: deId, nick: origem?.nick }
                ]
            });
        } else {
            if (socketOrigemId) {
                io.to(socketOrigemId).emit('convite:recusado', { porNick: meuNick });
            }
        }
    });

    // ===== Encerrar conexão =====
    socket.on('conexao:encerrar', () => {
        encerrarConexaoDe(io, meuId);
    });

    socket.on('disconnect', () => {
        if (socketsPorUsuario.get(meuId) === socket.id) {
            socketsPorUsuario.delete(meuId);
        }
    });
}

function encerrarConexaoDe(io, usuarioId) {
    const parceiroId = parceirosConectados.get(usuarioId);
    if (!parceiroId) return;

    const sala = nomeDaSala(usuarioId, parceiroId);
    io.to(sala).emit('conexao:encerrada');
    io.in(sala).socketsLeave(sala);

    parceirosConectados.delete(usuarioId);
    parceirosConectados.delete(parceiroId);
}

module.exports = { registrarEventosSocket, socketsPorUsuario, parceirosConectados, nomeDaSala };