const containerTabuleiros = document.getElementById('tabuleiros');
const teclado = document.getElementById('teclado');
const status = document.getElementById('status-jogo');

const tamanhoPalavra = 5;
let tentativasMax = 6;
let numBoards = 1;
let tentativaAtual = 0;
let jogoFinalizado = false;
let letrasAtuais = '';
let linhasPorBoard = [];

const LINHAS_TECLADO = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

function montarTabuleiros(qtdBoards, numTentativas, tamanho) {
    containerTabuleiros.innerHTML = '';
    linhasPorBoard = new Array(qtdBoards).fill(0);

    for (let b = 0; b < qtdBoards; b++) {
        const tabuleiro = document.createElement('div');
        tabuleiro.classList.add('tabuleiro');
        tabuleiro.dataset.board = b;

        for (let i = 0; i < numTentativas; i++) {
            const linha = document.createElement('div');
            linha.classList.add('linha-termo');
            linha.dataset.linha = i;

            for (let j = 0; j < tamanho; j++) {
                const celula = document.createElement('div');
                celula.classList.add('celula-termo');
                linha.appendChild(celula);
            }
            tabuleiro.appendChild(linha);
        }
        containerTabuleiros.appendChild(tabuleiro);
    }
}

function montarTeclado() {
    teclado.innerHTML = '';
    LINHAS_TECLADO.forEach(linhaTeclas => {
        const linha = document.createElement('div');
        linha.classList.add('linha-teclado');

        linhaTeclas.forEach(tecla => {
            const btn = document.createElement('button');
            btn.classList.add('tecla');
            if (tecla === 'ENTER' || tecla === 'BACK') btn.classList.add('tecla-larga');
            btn.dataset.tecla = tecla;
            btn.textContent = tecla === 'BACK' ? '⌫' : tecla;
            btn.addEventListener('click', () => processarTecla(tecla));
            linha.appendChild(btn);
        });

        teclado.appendChild(linha);
    });
}

function atualizarLinhaEmDigitacao() {
    for (let b = 0; b < numBoards; b++) {
        const tabuleiro = containerTabuleiros.querySelector(`[data-board="${b}"]`);
        if (tabuleiro.dataset.resolvida === 'true') continue;

        const linha = tabuleiro.querySelector(`[data-linha="${linhasPorBoard[b]}"]`);
        if (!linha) continue;

        const celulas = linha.querySelectorAll('.celula-termo');
        celulas.forEach((celula, i) => {
            celula.textContent = letrasAtuais[i] || '';
            celula.classList.toggle('preenchida', !!letrasAtuais[i]);
        });
    }
}

function processarTecla(tecla) {
    if (jogoFinalizado) return;

    if (tecla === 'BACK') {
        letrasAtuais = letrasAtuais.slice(0, -1);
        atualizarLinhaEmDigitacao();
        return;
    }

    if (tecla === 'ENTER') {
        enviarPalpite();
        return;
    }

    if (letrasAtuais.length < tamanhoPalavra) {
        letrasAtuais += tecla;
        atualizarLinhaEmDigitacao();
    }
}

document.addEventListener('keydown', (e) => {
    const tecla = e.key.toUpperCase();
    if (tecla === 'ENTER') processarTecla('ENTER');
    else if (tecla === 'BACKSPACE') processarTecla('BACK');
    else if (/^[A-Z]$/.test(tecla)) processarTecla(tecla);
});

function preencherLinhaBoard(indiceBoard, indiceLinha, palpite, resultado, aoTerminar) {
    const tabuleiro = containerTabuleiros.querySelector(`[data-board="${indiceBoard}"]`);
    const linha = tabuleiro.querySelector(`[data-linha="${indiceLinha}"]`);
    const celulas = linha.querySelectorAll('.celula-termo');

    celulas.forEach((celula, i) => {
        setTimeout(() => {
            celula.classList.add('virando');
            setTimeout(() => {
                celula.textContent = palpite[i];
                celula.classList.add(resultado[i]);
                celula.classList.remove('virando');
            }, 150);
        }, i * 150);
    });

    if (aoTerminar) setTimeout(aoTerminar, palpite.length * 150 + 200);
}

function atualizarCorTeclado(letra, cor) {
    const btn = teclado.querySelector(`[data-tecla="${letra}"]`);
    if (!btn) return;

    const prioridade = { cinza: 0, amarelo: 1, verde: 2 };
    const corAtual = btn.dataset.cor || 'cinza';

    if (!btn.dataset.cor || prioridade[cor] > prioridade[corAtual]) {
        btn.classList.remove('cinza', 'amarelo', 'verde');
        btn.classList.add(cor);
        btn.dataset.cor = cor;
    }
}

async function enviarPalpite() {
    if (letrasAtuais.length !== tamanhoPalavra) {
        status.textContent = `A palavra precisa ter ${tamanhoPalavra} letras.`;
        return;
    }

    try {
        const resposta = await fetch(`/api/termo/${TIPO_JOGO}/${MODO_JOGO}/palpite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ palpite: letrasAtuais })
        });

        const dados = await resposta.json();
        if (!resposta.ok) { status.textContent = dados.error; return; }

        const palpiteEnviado = letrasAtuais;
        letrasAtuais = '';

        let animacoesRestantes = 0;

        dados.boards.forEach((boardResp, b) => {
            if (!boardResp.resultado) return;

            const linhaIndex = linhasPorBoard[b];
            linhasPorBoard[b]++;
            animacoesRestantes++;

            preencherLinhaBoard(b, linhaIndex, palpiteEnviado, boardResp.resultado, () => {
                animacoesRestantes--;
                if (boardResp.resolvida) {
                    containerTabuleiros.querySelector(`[data-board="${b}"]`).dataset.resolvida = 'true';
                }
                if (animacoesRestantes === 0) finalizarTurno(dados);
            });
        });

        palpiteEnviado.split('').forEach((letra, i) => {
            const cores = dados.boards.filter(bd => bd.resultado).map(bd => bd.resultado[i]);
            const melhor = cores.includes('verde') ? 'verde' : cores.includes('amarelo') ? 'amarelo' : 'cinza';
            if (cores.length > 0) atualizarCorTeclado(letra, melhor);
        });

        if (animacoesRestantes === 0) finalizarTurno(dados);

    } catch (error) {
        status.textContent = 'Erro de conexão com o servidor.';
    }
}

function finalizarTurno(dados) {
    tentativaAtual++;

    if (dados.finalizado) {
        jogoFinalizado = true;
        mostrarResultadoFinal(dados);
    } else {
        status.textContent = `Tentativa ${tentativaAtual + 1} de ${tentativasMax}`;
    }
}

function mostrarResultadoFinal(dados) {
    window.abrirModalResultado({
        venceu: dados.venceu,
        tempoSegundos: dados.tempoSegundos,
        palavrasSecretas: dados.palavrasSecretas,
        proximoLink: PROXIMO_JOGO.link,
        proximoTexto: PROXIMO_JOGO.texto,
        proximoAcao: PROXIMO_JOGO.acao
    });
}

async function iniciarJogo() {
    const resposta = await fetch(`/api/termo/${TIPO_JOGO}/${MODO_JOGO}/novo`, { method: 'POST' });
    const dados = await resposta.json();

    tentativasMax = dados.tentativasMax;
    numBoards = dados.numBoards;

    montarTabuleiros(numBoards, tentativasMax, tamanhoPalavra);
    montarTeclado();

    dados.boards.forEach((board, b) => {
        board.tentativas.forEach((t, i) => {
            preencherLinhaBoard(b, i, t.palpite, t.resultado);
            linhasPorBoard[b] = i + 1;
        });
        if (board.resolvida) {
            containerTabuleiros.querySelector(`[data-board="${b}"]`).dataset.resolvida = 'true';
        }
    });

    tentativaAtual = Math.max(...linhasPorBoard, 0);

    if (dados.finalizado) {
        jogoFinalizado = true;
        mostrarResultadoFinal({
            venceu: dados.boards.every(b => b.resolvida),
            tempoSegundos: dados.tempoSegundos,
            palavrasSecretas: dados.boards.map(b => b.palavraSecreta)
        });
    } else {
        status.textContent = `Tentativa ${tentativaAtual + 1} de ${tentativasMax}`;
    }
}

iniciarJogo();