const mensagem = document.getElementById('mensagem');

// CADASTRO
document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
    e.preventDefault(); // impede o formulário de recarregar a página (comportamento padrão do HTML)

    const nome = document.getElementById('cad-nome').value;
    const nick = document.getElementById('cad-nick').value;
    const senha = document.getElementById('cad-senha').value;

    try {
        const resposta = await fetch('/api/auth/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, nick, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = dados.error;
            return;
        }

        mensagem.textContent = dados.message;

    } catch (error) {
        mensagem.textContent = 'Erro de conexão com o servidor.';
    }
});

// LOGIN
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nick = document.getElementById('log-nick').value;
    const senha = document.getElementById('log-senha').value;

    try {
        const resposta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = dados.error;
            return;
        }

        mensagem.textContent = `Bem-vindo, ${dados.nick}! Redirecionando...`;
        setTimeout(() => {
            window.location.href = '/'; // por enquanto vai pra raiz, depois criamos a home de verdade
        }, 1000);

    } catch (error) {
        mensagem.textContent = 'Erro de conexão com o servidor.';
    }
});

// Verifica se já está logado ao abrir a página
(async () => {
    const resposta = await fetch('/api/auth/me');
    if (resposta.ok) {
        const dados = await resposta.json();
        mensagem.textContent = `Você já está logado como ${dados.nick}.`;
    }
})();