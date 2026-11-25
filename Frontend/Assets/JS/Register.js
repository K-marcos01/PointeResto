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

    document.getElementById('btn-register-submit').addEventListener('click', handleRegister);
    document.getElementById('btn-guest-explore').addEventListener('click', goToGuest);

    document.getElementById('reg-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
});

async function handleRegister() {
    const prenom   = document.getElementById('reg-prenom').value.trim();
    const nom      = document.getElementById('reg-nom').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const roleEl   = document.getElementById('reg-role');
    const role     = roleEl ? roleEl.value : 'client';
    const btn      = document.getElementById('btn-register-submit');

    hideError();

    if (!prenom || !nom || !email || !password) {
        showError('Veuillez remplir tous les champs.');
        return;
    }
    if (password.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Création…';

    try {
        const res = await Auth.register(nom, prenom, email, password, role);
        Toast.success('Compte créé avec succès !');
        const target = (res.user && res.user.role === 'restaurateur') ? 'Dashboard.html' : 'Index.html';
        setTimeout(() => { window.location.href = target; }, 800);
    } catch (e) {
        showError(e.message || 'Inscription impossible.');
        btn.disabled = false;
        btn.textContent = 'Créer mon compte';
    }
}

function goToGuest() {
    localStorage.removeItem('pr_token');
    Auth.initClientSession();
    window.location.href = 'Index.html';
}

function showError(msg) {
    const err = document.getElementById('reg-error');
    if (err) {
        err.textContent = msg;
        err.classList.add('visible');
    }
}

function hideError() {
    const err = document.getElementById('reg-error');
    if (err) {
        err.textContent = '';
        err.classList.remove('visible');
    }
}