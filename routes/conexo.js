const express = require('express');
const router = express.Router();
const { jogoDoDia, jogoAleatorio, paletaCores, jogoAPartirDeBase } = require('../games/conexo');
const db = require('../database/db');
const exigirLogin = require('../middleware/auth');


const MAX_ERROS = 4;

function criarSessaoJogo({ jogoBase, tabuleiro }) {
    return {
        jogoBase,
        tabuleiroOrdem: tabuleiro,
        gruposResolvidos: [],
        erros: 0,
        maxErros: MAX_ERROS,
        finalizado: false,
        vencido: false,
        iniciadoEm: Date.now()
    };
}



function montarRespostaTabuleiro(jogo) {
    return {
        tabuleiro: jogo.tabuleiroOrdem
            .filter(t => !jogo.gruposResolvidos.includes(t.grupoIndex))
            .map(t => ({ palavra: t.palavra })),
        maxErros: jogo.maxErros,
        erros: jogo.erros,
        gruposResolvidos: jogo.gruposResolvidos.map(gi => jogo.jogoBase.grupos[gi]),
        finalizado: jogo.finalizado,
        vencido: jogo.vencido,
        tempoSegundos: jogo.finalizado ? jogo.tempoSegundos : undefined,
        respostaCompleta: jogo.finalizado ? jogo.jogoBase.grupos : undefined
    };
}

function processarPalpite(req, res, chave) {
    const jogo = req.session[chave];

    if (!jogo || jogo.finalizado) {
        return res.status(400).json({ error: 'Nenhum jogo ativo.' });
    }

    const { palavras } = req.body;

    if (!Array.isArray(palavras) || palavras.length !== 4) {
        return res.status(400).json({ error: 'Selecione exatamente 4 palavras.' });
    }

    const grupoIndices = palavras.map(p => {
        const item = jogo.tabuleiroOrdem.find(t => t.palavra === p);
        return item ? item.grupoIndex : -1;
    });

    if (grupoIndices.includes(-1)) {
        return res.status(400).json({ error: 'Palavra inválida.' });
    }

    const grupoAlvo = grupoIndices[0];
    const todasIguais = grupoIndices.every(gi => gi === grupoAlvo);
    const jaResolvido = jogo.gruposResolvidos.includes(grupoAlvo);

    if (todasIguais && !jaResolvido) {
        jogo.gruposResolvidos.push(grupoAlvo);
        const venceu = jogo.gruposResolvidos.length === jogo.jogoBase.grupos.length;

        if (venceu) {
            jogo.finalizado = true;
            jogo.vencido = true;
            jogo.tempoSegundos = Math.floor((Date.now() - jogo.iniciadoEm) / 1000);
        }

        return res.json({
            correto: true,
            grupo: jogo.jogoBase.grupos[grupoAlvo],
            errosRestantes: jogo.maxErros - jogo.erros,
            finalizado: jogo.finalizado,
            vencido: jogo.vencido,
            tempoSegundos: jogo.finalizado ? jogo.tempoSegundos : undefined
        });
    }

    // Errou
    jogo.erros++;

    const contagem = {};
    grupoIndices.forEach(gi => contagem[gi] = (contagem[gi] || 0) + 1);
    const quaseLa = Object.values(contagem).some(c => c === 3);

    if (jogo.erros >= jogo.maxErros) {
        jogo.finalizado = true;
        jogo.vencido = false;
        jogo.tempoSegundos = Math.floor((Date.now() - jogo.iniciadoEm) / 1000);
    }

    res.json({
        correto: false,
        quaseLa,
        errosRestantes: jogo.maxErros - jogo.erros,
        finalizado: jogo.finalizado,
        vencido: jogo.finalizado ? jogo.vencido : undefined,
        tempoSegundos: jogo.finalizado ? jogo.tempoSegundos : undefined,
        respostaCompleta: jogo.finalizado ? jogo.jogoBase.grupos : undefined
    });
}

// ===== CUSTOMIZADO =====

router.get('/customizado/listar', (req, res) => {
    const busca = (req.query.busca || '').trim();
    const meuId = req.session.usuarioId || null;

    let sql = `
        SELECT id, titulo, criador_id, criador_nome, tamanho, privado, criado_em
        FROM conexo_customizado
        WHERE (
            privado = 0
            OR criador_id = ?
        )
    `;
    const params = [meuId];

    if (busca) {
        sql += ` AND (titulo LIKE ? OR criador_nome LIKE ?)`;
        params.push(`%${busca}%`, `%${busca}%`);
    }

    sql += ` ORDER BY criado_em DESC`;

    const jogos = db.prepare(sql).all(...params);
    res.json(jogos);
});

router.post('/customizado/criar', exigirLogin, (req, res) => {
    const { titulo, grupos, privado } = req.body;

    if (!Array.isArray(grupos) || grupos.length < 4 || grupos.length > 9) {
        return res.status(400).json({ error: 'O jogo deve ter entre 4 e 9 quartetos.' });
    }

    for (const grupo of grupos) {
        if (!grupo.relacao || !Array.isArray(grupo.palavras) || grupo.palavras.length !== 4) {
            return res.status(400).json({ error: 'Cada quarteto precisa de uma relação e 4 palavras.' });
        }
        if (grupo.palavras.some(p => !p || !p.trim())) {
            return res.status(400).json({ error: 'Nenhuma palavra pode ficar em branco.' });
        }
    }

    const usuario = db.prepare('SELECT nome FROM usuarios WHERE id = ?').get(req.session.usuarioId);
    if (!usuario) {
        return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    }

    const cores = paletaCores(grupos.length);
    const gruposComCor = grupos.map((g, i) => ({
        relacao: g.relacao.trim(),
        cor: cores[i],
        palavras: g.palavras.map(p => p.trim().toUpperCase())
    }));

    const inserir = db.prepare(`
        INSERT INTO conexo_customizado (titulo, criador_id, criador_nome, tamanho, grupos, privado)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const resultado = inserir.run(
        titulo && titulo.trim() ? titulo.trim() : 'Jogo sem título',
        req.session.usuarioId,
        usuario.nome,
        grupos.length,
        JSON.stringify(gruposComCor),
        privado ? 1 : 0
    );

    res.status(201).json({ id: resultado.lastInsertRowid });
});

router.delete('/customizado/:id', exigirLogin, (req, res) => {
    const jogo = db.prepare('SELECT criador_id FROM conexo_customizado WHERE id = ?').get(req.params.id);

    if (!jogo) {
        return res.status(404).json({ error: 'Jogo não encontrado.' });
    }

    if (jogo.criador_id !== req.session.usuarioId) {
        return res.status(403).json({ error: 'Você só pode excluir jogos que você criou.' });
    }

    db.prepare('DELETE FROM conexo_customizado WHERE id = ?').run(req.params.id);
    res.json({ message: 'Jogo excluído.' });
});

router.post('/customizado/:id/novo', (req, res) => {
    const registro = db.prepare('SELECT * FROM conexo_customizado WHERE id = ?').get(req.params.id);

    if (!registro) {
        return res.status(404).json({ error: 'Jogo não encontrado.' });
    }

    if (registro.privado && registro.criador_id !== req.session.usuarioId) {
        return res.status(403).json({ error: 'Este jogo é privado.' });
    }

    const jogoBase = { grupos: JSON.parse(registro.grupos) };
    const chave = `conexo_custom_${registro.id}`;

    req.session[chave] = criarSessaoJogo(jogoAPartirDeBase(jogoBase));

    const respostaBase = montarRespostaTabuleiro(req.session[chave]);
    res.json({ ...respostaBase, titulo: registro.titulo, criadorNome: registro.criador_nome });
});

router.post('/customizado/:id/palpite', (req, res) => {
    processarPalpite(req, res, `conexo_custom_${req.params.id}`);
});

router.post('/diario/novo', (req, res) => {
    const { jogoBase, tabuleiro, data } = jogoDoDia();

    if (req.session.conexo_diario && req.session.conexo_diario.data === data) {
        return res.json(montarRespostaTabuleiro(req.session.conexo_diario));
    }

    req.session.conexo_diario = { ...criarSessaoJogo({ jogoBase, tabuleiro }), data };
    res.json(montarRespostaTabuleiro(req.session.conexo_diario));
});

router.post('/diario/palpite', (req, res) => processarPalpite(req, res, 'conexo_diario'));

router.post('/treino/novo', (req, res) => {
    const { jogoBase, tabuleiro } = jogoAleatorio();
    req.session.conexo_treino = criarSessaoJogo({ jogoBase, tabuleiro });
    res.json(montarRespostaTabuleiro(req.session.conexo_treino));
});

router.post('/treino/palpite', (req, res) => processarPalpite(req, res, 'conexo_treino'));

module.exports = router;