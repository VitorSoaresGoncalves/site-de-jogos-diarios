const grupoResolvidosEl = document.getElementById('grupos-resolvidos');
const gradeEl = document.getElementById('grade-conexo');
const status = document.getElementById('status-conexo');
const btnDeselecionar = document.getElementById('btn-deselecionar');
const vidasEl = document.getElementById('vidas-conexo');
const btnEmbaralhar = document.getElementById('btn-embaralhar');


let tabuleiroAtual = [];
let selecionadas = [];
let maxErros = 4;
let jogoFinalizado = false;
let enviandoPalpite = false;

function renderizarVidas(erros) {
    vidasEl.innerHTML = '';
    for (let i = 0; i < maxErros; i++) {
        const ponto = document.createElement('div');
        ponto.classList.add('vida-ponto');
        if (i < erros) ponto.classList.add('perdida');
        vidasEl.appendChild(ponto);
    }
}

function renderizarGrupoResolvido(grupo) {
    const div = document.createElement('div');
    div.classList.add('barra-grupo', grupo.cor || 'cinza');
    div.innerHTML = `<strong>${grupo.relacao}</strong><span>${grupo.palavras.join(', ')}</span>`;
    grupoResolvidosEl.appendChild(div);
}

function renderizarGrade() {
    gradeEl.innerHTML = '';
    tabuleiroAtual.forEach(item => {
        const peca = document.createElement('div');
        peca.classList.add('peca-conexo');
        peca.textContent = item.palavra;
        peca.dataset.palavra = item.palavra;
        if (selecionadas.includes(item.palavra)) peca.classList.add('selecionada');
        peca.addEventListener('click', () => alternarSelecao(item.palavra));
        gradeEl.appendChild(peca);
    });
}

function alternarSelecao(palavra) {
    if (jogoFinalizado || enviandoPalpite) return;

    if (selecionadas.includes(palavra)) {
        selecionadas = selecionadas.filter(p => p !== palavra);
    } else {
        if (selecionadas.length >= 4) return;

        selecionadas.push(palavra);

        // Envia automaticamente ao selecionar 4 palavras
        if (selecionadas.length === 4) {
            enviarPalpite();
            selecionadas = [];
            renderizarGrade();
        }
    }

    renderizarGrade();
}

btnDeselecionar.addEventListener('click', () => {
    selecionadas = [];
    renderizarGrade();
});

btnEmbaralhar.addEventListener('click', () => {
    for (let i = tabuleiroAtual.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tabuleiroAtual[i], tabuleiroAtual[j]] = [tabuleiroAtual[j], tabuleiroAtual[i]];
    }
    renderizarGrade();
});



function sacudirSelecionadas() {
    selecionadas.forEach(palavra => {
        const el = gradeEl.querySelector(`[data-palavra="${palavra}"]`);
        if (!el) return;
        el.classList.add('sacudir');
        setTimeout(() => el.classList.remove('sacudir'), 400);
    });
}

async function enviarPalpite() {
    if (selecionadas.length !== 4 || jogoFinalizado || enviandoPalpite) return;

    enviandoPalpite = true;

    try {
        const resposta = await fetch(`${API_BASE}/palpite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ palavras: selecionadas })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            status.textContent = dados.error;
            return;
        }

        if (dados.correto) {
            renderizarGrupoResolvido(dados.grupo);

            tabuleiroAtual = tabuleiroAtual.filter(
                item => !dados.grupo.palavras.includes(item.palavra)
            );

            selecionadas = [];
            renderizarGrade();

            status.textContent = 'Isso mesmo! Continue.';
        } else {
            sacudirSelecionadas();

            status.textContent = dados.quaseLa
                ? 'Quase lá! Uma palavra a mais.'
                : 'Grupo incorreto.';
        }

        renderizarVidas(
            dados.errosRestantes !== undefined
                ? (maxErros - dados.errosRestantes)
                : 0
        );

        if (dados.finalizado) {
            jogoFinalizado = true;

            if (!dados.vencido && dados.respostaCompleta) {
                grupoResolvidosEl.innerHTML = '';

                dados.respostaCompleta.forEach(grupo =>
                    renderizarGrupoResolvido(grupo)
                );

                gradeEl.innerHTML = '';
            }

            window.abrirModalResultado({
                venceu: dados.vencido,
                tempoSegundos: dados.tempoSegundos,
                palavrasSecretas: [],
                proximoLink: PROXIMO_JOGO.link,
                proximoTexto: PROXIMO_JOGO.texto,
                proximoAcao: PROXIMO_JOGO.acao
            });
        }

    } catch (error) {
        status.textContent = 'Erro de conexão com o servidor.';
    } finally {
        enviandoPalpite = false;
    }
}

async function iniciarJogo() {
    const resposta = await fetch(`${API_BASE}/novo`, { method: 'POST' });
    const dados = await resposta.json();

    maxErros = dados.maxErros;
    tabuleiroAtual = dados.tabuleiro;

    dados.gruposResolvidos.forEach(grupo => renderizarGrupoResolvido(grupo));
    renderizarVidas(dados.erros);
    renderizarGrade();

    if (dados.finalizado) {
        jogoFinalizado = true;
        window.abrirModalResultado({
            venceu: dados.vencido,
            tempoSegundos: dados.tempoSegundos,
            palavrasSecretas: [],
            proximoLink: PROXIMO_JOGO.link,
            proximoTexto: PROXIMO_JOGO.texto,
            proximoAcao: PROXIMO_JOGO.acao
        });
    } else {
        status.textContent = 'Encontre os grupos de 4 palavras relacionadas.';
    }
}

iniciarJogo();