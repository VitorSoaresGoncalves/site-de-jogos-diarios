function iniciarEstadoTempo() {
    return {
        iniciadoEm: Date.now(),
        tempoPausadoAcumulado: 0,
        pausadoDesde: null
    };
}

function pausar(jogo) {
    if (!jogo.pausadoDesde) {
        jogo.pausadoDesde = Date.now();
    }
}

function retomar(jogo) {
    if (jogo.pausadoDesde) {
        jogo.tempoPausadoAcumulado += Date.now() - jogo.pausadoDesde;
        jogo.pausadoDesde = null;
    }
}

function tempoDecorridoSegundos(jogo) {
    const agora = Date.now();
    const pausadoAgora = jogo.pausadoDesde ? (agora - jogo.pausadoDesde) : 0;
    return Math.floor((agora - jogo.iniciadoEm - jogo.tempoPausadoAcumulado - pausadoAgora) / 1000);
}

module.exports = { iniciarEstadoTempo, pausar, retomar, tempoDecorridoSegundos };