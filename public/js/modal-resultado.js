let modalFoiFechada = false;
let ultimoResultado = null;

function criarModalResultado() {
    if (document.getElementById('overlay-resultado')) return;

    const overlay = document.createElement('div');
    overlay.id = 'overlay-resultado';
    overlay.classList.add('overlay-resultado');

    overlay.innerHTML = `
        <div class="modal-resultado">
            <button id="fechar-modal-resultado" class="fechar-modal">&times;</button>
            <h2 id="modal-titulo"></h2>
            <p id="modal-tempo"></p>
            <p id="modal-palavras"></p>
            <button id="btn-proximo-jogo" class="rainbow-hover"><span class="sp"></span></button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('fechar-modal-resultado').addEventListener('click', fecharModalResultado);
}

function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
}

window.abrirModalResultado = function ({ venceu, tempoSegundos, palavrasSecretas, proximoLink, proximoTexto, proximoAcao }) {
    criarModalResultado();
    ultimoResultado = { venceu, tempoSegundos, palavrasSecretas, proximoLink, proximoTexto, proximoAcao };

    document.getElementById('modal-titulo').textContent = venceu ? '🎉 Você venceu!' : '😔 Não dessa vez';
    document.getElementById('modal-tempo').textContent = `Tempo: ${formatarTempo(tempoSegundos)}`;

    const mostrarPalavras = !venceu || palavrasSecretas.length > 1;
    document.getElementById('modal-palavras').textContent = mostrarPalavras
        ? (palavrasSecretas.length > 1 ? `Palavras: ${palavrasSecretas.join(', ')}` : `Palavra: ${palavrasSecretas[0]}`)
        : '';

    const btn = document.getElementById('btn-proximo-jogo');
    btn.querySelector('.sp').textContent = proximoTexto || 'Continuar';
    btn.onclick = () => {
        if (proximoAcao) proximoAcao();
        else if (proximoLink) window.location.href = proximoLink;
    };

    document.getElementById('overlay-resultado').classList.add('visivel');
    modalFoiFechada = false;
};

function fecharModalResultado() {
    document.getElementById('overlay-resultado').classList.remove('visivel');
    modalFoiFechada = true;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && modalFoiFechada && ultimoResultado) {
        window.abrirModalResultado(ultimoResultado);
    }
});