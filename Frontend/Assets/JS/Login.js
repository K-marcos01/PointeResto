document.addEventListener('DOMContentLoaded', () => {
    // Rediriger si déjà connecté
    const user = localStorage.getItem('pr_user');
    if (user) {
        const parsed = JSON.parse(user);
        if (parsed && parsed.id_utilisateur !== 0) {
            window.location.href = parsed.role === 'restaurateur' ? 'Dashboard.html' : 'Index.html';
            return;
        }
    }

    document.getElementById('btn-login-submit').addEventListener('click', handleLogin);
    document.getElementById('btn-guest-explore').addEventListener('click', goToGuest);

    // Permettre Entrée pour soumettre
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    const btn   = document.getElementById('btn-login-submit');

    if (!email || !pass) {
        showError('Veuillez remplir email et mot de passe.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Connexion…';

    try {
        const role = await Auth.login(email, pass);
        if (role) {
            window.location.href = (role === 'restaurateur') ? 'Dashboard.html' : 'Index.html';
        } else {
            showError('Identifiants incorrects.');
            btn.disabled = false;
            btn.textContent = 'Se connecter';
        }
    } catch (e) {
        showError('Erreur réseau. Vérifiez votre connexion.');
        btn.disabled = false;
        btn.textContent = 'Se connecter';
    }
}

function goToGuest() {
    Auth.initClientSession();
    window.location.href = 'Index.html';
}

function showError(msg) {
    const err = document.getElementById('login-error');
    if (err) {
        err.textContent = msg;
        err.style.display = 'block';
    }
}
