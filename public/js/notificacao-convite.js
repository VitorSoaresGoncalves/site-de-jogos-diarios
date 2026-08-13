function criarContainerNotificacoes() {
    if (document.getElementById('container-notificacoes')) return;

    const container = document.createElement('div');
    container.id = 'container-notificacoes';
    container.classList.add('container-notificacoes');
    document.body.appendChild(container);
}

function mostrarNotificacaoConvite(deId, deNick) {
    criarContainerNotificacoes();
    const container = document.getElementById('container-notificacoes');

    const card = document.createElement('div');
    card.classList.add('notificacao-convite');
    card.innerHTML = `
        <p><strong>${deNick}</strong> quer se conectar com você para jogar.</p>
        <div class="acoes-notificacao">
            <button class="btn-aceitar-convite rainbow-hover botao-compacto"><span class="sp">Aceitar</span></button>
            <button class="btn-recusar-convite botao-recusar botao-compacto">Recusar</button>
        </div>
    `;

    card.querySelector('.btn-aceitar-convite').addEventListener('click', () => {
        socketConexao.emit('convite:responder', { deId, aceitar: true });
        card.remove();
    });

    card.querySelector('.btn-recusar-convite').addEventListener('click', () => {
        socketConexao.emit('convite:responder', { deId, aceitar: false });
        card.remove();
    });

    container.appendChild(card);
}

function mostrarToast(mensagem, tipo = 'info') {
    criarContainerNotificacoes();
    const container = document.getElementById('container-notificacoes');

    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${tipo}`);
    toast.textContent = mensagem;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('saindo');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function mostrarNotificacaoResultado({ nick, jogoNome, tempoSegundos }) {
    criarContainerNotificacoes();
    const container = document.getElementById('container-notificacoes');

    const min = Math.floor(tempoSegundos / 60);
    const seg = tempoSegundos % 60;
    const tempoFormatado = `${min}:${seg.toString().padStart(2, '0')}`;

    const card = document.createElement('div');
    card.classList.add('notificacao-resultado');
    card.innerHTML = `
        <button class="fechar-notificacao">&times;</button>
        <span class="icone-notificacao">🎉</span>
        <h3>${nick} completou!</h3>
        <p class="jogo-notificacao">${jogoNome}</p>
        <p class="tempo-notificacao">⏱ ${tempoFormatado}</p>
    `;

    card.querySelector('.fechar-notificacao').addEventListener('click', () => {
        card.classList.add('saindo');
        setTimeout(() => card.remove(), 300);
    });

    document.body.appendChild(card);
}