document.addEventListener('DOMContentLoaded', () => {
    const userRaw = localStorage.getItem('pr_user');
    const token = Auth.getToken();
    if (userRaw && token) {
        try {
            const parsed = JSON.parse(userRaw);
            if (parsed && parsed.id_utilisateur !== 0) {
                window.location.href = (parsed.role === 'restaurateur' || parsed.role === 'moderateur')
                    ? 'Dashboard.html'
                    : 'Index.html';
                return;
            }
        } catch (e) {
            localStorage.removeItem('pr_user');
        }
    }

    document.getElementById('btn-login-submit').addEventListener('click', handleLogin);
    document.getElementById('btn-guest-explore').addEventListener('click', goToGuest);

    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    const btn   = document.getElementById('btn-login-submit');

    hideError();

    if (!email || !pass) {
        showError('Veuillez remplir email et mot de passe.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Connexion…';

    try {
        const role = await Auth.login(email, pass);
        if (role) {
            window.location.href = (role === 'restaurateur' || role === 'moderateur')
                ? 'Dashboard.html'
                : 'Index.html';
        } else {
            showError('Identifiants incorrects.');
            btn.disabled = false;
            btn.textContent = 'Se connecter';
        }
    } catch (e) {
        showError(e.status === 401 ? 'Identifiants incorrects.' : (e.message || 'Erreur réseau. Vérifiez votre connexion.'));
        btn.disabled = false;
        btn.textContent = 'Se connecter';
    }
}

function goToGuest() {
    localStorage.removeItem('pr_token');
    Auth.initClientSession();
    window.location.href = 'Index.html';
}

function showError(msg) {
    const err = document.getElementById('login-error');
    if (err) {
        err.textContent = msg;
        err.classList.add('visible');
    }
}

function hideError() {
    const err = document.getElementById('login-error');
    if (err) {
        err.textContent = '';
        err.classList.remove('visible');
    }
}