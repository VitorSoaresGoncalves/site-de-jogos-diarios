async function carregarAreaUsuario() {
    const area = document.getElementById('area-usuario');
    if (!area) return;

    try {
        const resposta = await fetch('/api/auth/me');

        if (resposta.ok) {
            const dados = await resposta.json();

            window.usuarioAtualId = dados.id;

            if (typeof iniciarConexaoJogadores === 'function') {
                iniciarConexaoJogadores();
                montarPainelConexao();
            }

            area.innerHTML = `
                <span class="saudacao">Olá, ${dados.nick}</span>
                <button id="btn-logout" class="rainbow-hover">
                    <span class="sp"><strong>Sair</strong></span>
                </button>
            `;

            document.getElementById('btn-logout').addEventListener('click', async () => {
                await fetch('/api/auth/logout', {
                    method: 'POST'
                });

                window.location.reload();
            });

        } else {
            area.innerHTML = `
                <a href="/login.html" class="rainbow-hover">
                    <span class="sp"><strong>Register</strong></span>
                </a>
            `;
        }

    } catch (error) {
        area.innerHTML = `
            <a href="/login.html" class="rainbow-hover">
                <span class="sp"><strong>Register</strong></span>
            </a>
        `;
    }
}

carregarAreaUsuario();