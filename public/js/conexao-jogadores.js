let socketConexao = null;
let parceiroAtual = null; // { id, nick } ou null



function iniciarConexaoJogadores() {

    
    console.log('>>> iniciarConexaoJogadores() foi chamada');
    socketConexao = io();

    socketConexao.on('connect', () => {
        console.log('>>> Socket conectado com ID:', socketConexao.id);
    });

    socketConexao.on('convite:recebido', ({ deId, deNick }) => {
        console.log('>>> Evento convite:recebido chegou:', deId, deNick);
        mostrarPopupConvite(deId, deNick);
    });


    socketConexao.on('convite:enviado', ({ paraNick }) => {
        atualizarStatusConexao(`Convite enviado para ${paraNick}. Aguardando resposta...`);
    });

    socketConexao.on('convite:erro', ({ mensagem }) => {
        atualizarStatusConexao(mensagem, true);
    });

    socketConexao.on('convite:recusado', ({ porNick }) => {
        atualizarStatusConexao(`${porNick} recusou o convite.`, true);
    });

    socketConexao.on('conexao:estabelecida', ({ jogadores }) => {
        const meuId = window.usuarioAtualId;
        parceiroAtual = jogadores.find(j => j.id !== meuId);
        atualizarPainelConectado();
        notificarEntradaEmJogo();
    });

    socketConexao.on('conexao:encerrada', () => {
        parceiroAtual = null;
        atualizarPainelConectado();
    });

    socketConexao.on('parceiro:completou', ({ nick, jogoNome, tempoSegundos }) => {
        mostrarNotificacaoResultado({ nick, jogoNome, tempoSegundos });
    });

    socketConexao.on('jogo:parceiroEntrou', ({ rota, nick }) => {
        const rotaAtual = window.location.pathname + window.location.search;
        if (rotaAtual === rota) return; // já estou lá, não faz nada

        mostrarToast(`${nick} entrou em um jogo. Te levando junto...`, 'info');

        sessionStorage.setItem('navegacaoForcadaPeloParceiro', 'true');
        setTimeout(() => {
            window.location.href = rota;
        }, 1200);
    });
}

function formatarTempoNotificacao(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
}

function notificarVitoriaParceiro(tempoSegundos) {
    if (!socketConexao || !parceiroAtual) return;
    const jogoNome = window.NOME_JOGO_EXIBICAO || 'um jogo';
    socketConexao.emit('jogo:completou', { jogoNome, tempoSegundos });
}

function montarPainelConexao() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const painel = document.createElement('div');
    painel.id = 'painel-conexao';
    painel.classList.add('painel-conexao');
    nav.appendChild(painel);

    atualizarPainelConectado();
}

function atualizarPainelConectado() {
    const painel = document.getElementById('painel-conexao');
    if (!painel) return;

    if (parceiroAtual) {
        painel.innerHTML = `
            <span class="conectado-com">🔗 Conectado com ${parceiroAtual.nick}</span>
            <button id="btn-encerrar-conexao" class="rainbow-hover botao-compacto"><span class="sp">Encerrar</span></button>
        `;
        document.getElementById('btn-encerrar-conexao').addEventListener('click', () => {
            socketConexao.emit('conexao:encerrar');
            parceiroAtual = null;
            atualizarPainelConectado();
        });
    } else {
        painel.innerHTML = `<button id="btn-abrir-convite" class="rainbow-hover botao-compacto"><span class="sp">Conectar com jogador</span></button>`;
        document.getElementById('btn-abrir-convite').addEventListener('click', abrirFormularioConvite);
    }
}

function abrirFormularioConvite() {
    const nick = prompt('Digite o nick do jogador que você quer convidar:');
    if (!nick || !nick.trim()) return;
    socketConexao.emit('convite:enviar', { nickDestino: nick.trim() });
}

function mostrarPopupConvite(deId, deNick) {
    mostrarNotificacaoConvite(deId, deNick);
}

function atualizarStatusConexao(mensagem, isErro = false) {
    mostrarToast(mensagem, isErro ? 'erro' : 'info');
}

function estaEmPaginaDeJogo() {
    return window.EH_PAGINA_DE_JOGO === true;
}

function notificarEntradaEmJogo() {
    if (!socketConexao || !parceiroAtual || !estaEmPaginaDeJogo()) return;

    const foiNavegacaoForcada = sessionStorage.getItem('navegacaoForcadaPeloParceiro') === 'true';
    sessionStorage.removeItem('navegacaoForcadaPeloParceiro');

    if (foiNavegacaoForcada) return; // evita o "ping-pong" de navegação

    const rota = window.location.pathname + window.location.search;
    socketConexao.emit('jogo:entrou', { rota });
}