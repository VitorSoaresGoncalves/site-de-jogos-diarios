const express = require('express');
const router = express.Router();
const { avaliarPalpite, palavrasDoDia, palavrasAleatoriasUnicas, palavraExiste } = require('../games/termo');

const CONFIG = {
    termo:    { qtd: 1, tentativasMax: 6 },
    dueto:    { qtd: 2, tentativasMax: 7 },
    quarteto: { qtd: 4, tentativasMax: 9 }
};

function criarBoards(palavras) {
    return palavras.map(p => ({ palavraSecreta: p, tentativas: [], resolvida: false }));
}

function montarRespostaInicio(jogo) {
    return {
        tentativasMax: jogo.tentativasMax,
        numBoards: jogo.boards.length,
        finalizado: jogo.finalizado,
        tempoSegundos: jogo.finalizado ? jogo.tempoSegundos : undefined,
        boards: jogo.boards.map(b => ({
            tentativas: b.tentativas,
            resolvida: b.resolvida,
            palavraSecreta: jogo.finalizado ? b.palavraSecreta : undefined
        }))
    };
}

function processarPalpite(req, res, chave) {
    const jogo = req.session[chave];

    if (!jogo || jogo.finalizado) {
        return res.status(400).json({ error: 'Nenhum jogo ativo. Inicie um novo jogo.' });
    }

    const palpite = (req.body.palpite || '').toUpperCase();

    if (!jogo.boards.every(b => palpite.length === b.palavraSecreta.length)) {
        return res.status(400).json({ error: `A palavra deve ter ${jogo.boards[0].palavraSecreta.length} letras.` });
    }

    if (!palavraExiste(palpite)) {
        return res.status(400).json({ error: 'Palavra não está na lista.', tipo: 'palavra_invalida' });
    }

    jogo.tentativasUsadas++;

    const boardsResposta = jogo.boards.map(board => {
        if (board.resolvida) return { resultado: null, resolvida: true };

        const resultado = avaliarPalpite(palpite, board.palavraSecreta);
        board.tentativas.push({ palpite, resultado });
        if (palpite === board.palavraSecreta) board.resolvida = true;

        return { resultado, resolvida: board.resolvida };
    });

    const venceu = jogo.boards.every(b => b.resolvida);
    const acabou = jogo.tentativasUsadas >= jogo.tentativasMax;

    if (venceu || acabou) {
        jogo.finalizado = true;
        jogo.tempoSegundos = Math.floor((Date.now() - jogo.iniciadoEm) / 1000);
    }

    res.json({
        boards: boardsResposta,
        finalizado: jogo.finalizado,
        venceu,
        tentativasRestantes: jogo.tentativasMax - jogo.tentativasUsadas,
        tempoSegundos: jogo.finalizado ? jogo.tempoSegundos : undefined,
        palavrasSecretas: jogo.finalizado ? jogo.boards.map(b => b.palavraSecreta) : undefined
    });
}

// ===== Gera as rotas de DIÁRIO e TREINO para termo, dueto e quarteto =====
['termo', 'dueto', 'quarteto'].forEach(tipo => {
    const config = CONFIG[tipo];

    // --- Diário (palavra do dia, igual pra todo mundo) ---
    const chaveDiario = `termo_${tipo}_diario`;

    router.post(`/${tipo}/diario/novo`, (req, res) => {
        const { palavras, data } = palavrasDoDia(config.qtd, tipo);

        if (req.session[chaveDiario] && req.session[chaveDiario].data === data) {
            return res.json(montarRespostaInicio(req.session[chaveDiario]));
        }

        req.session[chaveDiario] = {
            data,
            boards: criarBoards(palavras),
            tentativasUsadas: 0,
            tentativasMax: config.tentativasMax,
            finalizado: false,
            iniciadoEm: Date.now()
        };

        res.json(montarRespostaInicio(req.session[chaveDiario]));
    });

    router.post(`/${tipo}/diario/palpite`, (req, res) => processarPalpite(req, res, chaveDiario));

    // --- Treino (palavras aleatórias, sempre novo jogo) ---
    const chaveTreino = `termo_${tipo}_treino`;

    router.post(`/${tipo}/treino/novo`, (req, res) => {
        req.session[chaveTreino] = {
            boards: criarBoards(palavrasAleatoriasUnicas(config.qtd)),
            tentativasUsadas: 0,
            tentativasMax: config.tentativasMax,
            finalizado: false,
            iniciadoEm: Date.now()
        };
        res.json(montarRespostaInicio(req.session[chaveTreino]));
    });

    router.post(`/${tipo}/treino/palpite`, (req, res) => processarPalpite(req, res, chaveTreino));
});

module.exports = router;