const fs = require('fs');
const path = require('path');


function carregarJogosBase() {
    return JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/conexo.json'), 'utf-8')
    );
}

function dataDeHojeBrasilia() {
    const formatador = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatador.format(new Date());
}

function hashTexto(texto) {
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
    return h;
}

function criarGerador(seed) {
    let a = seed;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function embaralhar(lista, seed) {
    const rand = criarGerador(seed);
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// Achata os grupos em uma lista única de { palavra, grupoIndex }, e embaralha
function montarTabuleiro(jogoBase, seed) {
    const palavras = [];
    jogoBase.grupos.forEach((grupo, i) => {
        grupo.palavras.forEach(p => palavras.push({ palavra: p, grupoIndex: i }));
    });
    return embaralhar(palavras, seed);
}

function jogoDoDia() {
    const jogos = carregarJogosBase();
    const hoje = dataDeHojeBrasilia();

    const randEscolha = criarGerador(hashTexto(`conexo-escolha-${hoje}`));
    const jogoBase = jogos[Math.floor(randEscolha() * jogos.length)];

    const seedTabuleiro = hashTexto(`conexo-tabuleiro-${hoje}`);
    return { jogoBase, tabuleiro: montarTabuleiro(jogoBase, seedTabuleiro), data: hoje };
}

function jogoAleatorio() {
    const jogos = carregarJogosBase();
    const jogoBase = jogos[Math.floor(Math.random() * jogos.length)];
    const seedTabuleiro = Math.floor(Math.random() * 1e9);
    return { jogoBase, tabuleiro: montarTabuleiro(jogoBase, seedTabuleiro) };
}

function paletaCores(qtdGrupos) {
    const paleta = ['amarelo', 'verde', 'azul', 'roxo', 'laranja', 'rosa', 'ciano', 'marrom', 'cinza'];
    return paleta.slice(0, qtdGrupos);
}

function jogoAPartirDeBase(jogoBase) {
    const seedTabuleiro = Math.floor(Math.random() * 1e9);
    return { jogoBase, tabuleiro: montarTabuleiro(jogoBase, seedTabuleiro) };
}

module.exports = { jogoDoDia, jogoAleatorio, paletaCores, jogoAPartirDeBase };