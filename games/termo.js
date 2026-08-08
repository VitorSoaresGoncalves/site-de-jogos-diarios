const fs = require('fs');
const path = require('path');

// Carregado UMA VEZ, quando o servidor inicia — não a cada requisição
const PALAVRAS = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/palavras-termo.json'), 'utf-8')
).map(p => p.toUpperCase());

// Set para checagem rápida de existência (O(1) em vez de percorrer o array inteiro)
const PALAVRAS_VALIDAS = new Set(PALAVRAS);

function carregarPalavras() {
    return PALAVRAS;
}

function palavraExiste(palavra) {
    return PALAVRAS_VALIDAS.has(palavra.toUpperCase());
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

function avaliarPalpite(palpite, palavraSecreta) {
    const resultado = new Array(palpite.length).fill('cinza');
    const letrasSecretas = palavraSecreta.split('');
    const letrasUsadas = new Array(letrasSecretas.length).fill(false);

    for (let i = 0; i < palpite.length; i++) {
        if (palpite[i] === letrasSecretas[i]) {
            resultado[i] = 'verde';
            letrasUsadas[i] = true;
        }
    }

    for (let i = 0; i < palpite.length; i++) {
        if (resultado[i] === 'verde') continue;
        const idx = letrasSecretas.findIndex((letra, j) => letra === palpite[i] && !letrasUsadas[j]);
        if (idx !== -1) {
            resultado[i] = 'amarelo';
            letrasUsadas[idx] = true;
        }
    }

    return resultado;
}

// Gerador pseudoaleatório determinístico (mesma "semente" = mesmos números sempre)
function criarGerador(seed) {
    let a = seed;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashTexto(texto) {
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
    return h;
}

// Sorteia `qtd` palavras diferentes, sempre as mesmas no mesmo dia (salChave separa termo/dueto/quarteto)
function palavrasDoDia(qtd, salChave) {
    const palavras = carregarPalavras();
    const hoje = dataDeHojeBrasilia();
    const rand = criarGerador(hashTexto(`${hoje}-${salChave}-${qtd}`));

    const indices = palavras.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return { palavras: indices.slice(0, qtd).map(i => palavras[i]), data: hoje };
}

// Sorteia `qtd` palavras diferentes, de forma realmente aleatória (treino)
function palavrasAleatoriasUnicas(qtd) {
    const copia = [...carregarPalavras()];
    const selecionadas = [];
    for (let i = 0; i < qtd; i++) {
        const idx = Math.floor(Math.random() * copia.length);
        selecionadas.push(copia.splice(idx, 1)[0]);
    }
    return selecionadas;
}

module.exports = { avaliarPalpite, palavrasDoDia, palavrasAleatoriasUnicas, palavraExiste };