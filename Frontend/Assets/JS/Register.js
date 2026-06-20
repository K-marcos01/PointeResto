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
    const btn      = document.getElementById('btn-register-submit');

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
        const res = await API.post('auth', {
            action: 'register',
            nom, prenom, email, password
        });

        localStorage.setItem('pr_user', JSON.stringify(res.user));
        Toast.success('Compte créé avec succès !');
        setTimeout(() => { window.location.href = 'Index.html'; }, 800);
    } catch (e) {
        showError(e.message || 'Inscription impossible.');
        btn.disabled = false;
        btn.textContent = 'Créer mon compte';
    }
}

function goToGuest() {
    Auth.initClientSession();
    window.location.href = 'Index.html';
}

function showError(msg) {
    const err = document.getElementById('reg-error');
    if (err) {
        err.textContent = msg;
        err.style.display = 'block';
    }
}
