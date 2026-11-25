const Auth = {
    login: async (email, password) => {
        const res = await API.post('auth', { email, password });
        if (res.token && res.user) {
            localStorage.removeItem('pr_guest');
            localStorage.setItem('pr_token', res.token);
            localStorage.setItem('pr_user', JSON.stringify(res.user));
            return res.user.role;
        }
        return null;
    },

    register: async (nom, prenom, email, password) => {
        const res = await API.post('auth', {
            action: 'register',
            nom,
            prenom,
            email,
            password
        });
        if (res.token && res.user) {
            localStorage.removeItem('pr_guest');
            localStorage.setItem('pr_token', res.token);
            localStorage.setItem('pr_user', JSON.stringify(res.user));
        }
        return res;
    },

    getToken: () => {
        return localStorage.getItem('pr_token') || null;
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('pr_token');
        if (!token) return false;
        try {
            const user = JSON.parse(localStorage.getItem('pr_user') || 'null');
            return Boolean(user && user.id_utilisateur && user.id_utilisateur !== 0);
        } catch (e) {
            return false;
        }
    },

    isGuestExploring: () => {
        return !Auth.isAuthenticated() && localStorage.getItem('pr_guest') === '1';
    },

    startGuestExploration: () => {
        localStorage.removeItem('pr_token');
        localStorage.setItem('pr_guest', '1');
        const guestUser = { id_utilisateur: 0, nom: 'Anonyme', role: 'client' };
        localStorage.setItem('pr_user', JSON.stringify(guestUser));
    },

    initClientSession: () => {
        if (!localStorage.getItem('pr_user')) {
            const guestUser = { id_utilisateur: 0, nom: 'Anonyme', role: 'client' };
            localStorage.setItem('pr_user', JSON.stringify(guestUser));
        }
    },

    getUser: () => {
        Auth.initClientSession();
        try {
            return JSON.parse(localStorage.getItem('pr_user'));
        } catch (e) {
            return { id_utilisateur: 0, nom: 'Anonyme', role: 'client' };
        }
    },

    getUserInitials: () => {
        const user = Auth.getUser();
        if (!user || user.id_utilisateur === 0) return '';
        const prenom = String(user.prenom || '').trim();
        const nom = String(user.nom || '').trim();
        if (prenom && nom) {
            return (prenom[0] + nom[0]).toUpperCase();
        }
        const full = (prenom || nom || 'U');
        return full.slice(0, 2).toUpperCase();
    },

    logout: (redirectTo = 'Connexion.html') => {
        localStorage.removeItem('pr_token');
        localStorage.removeItem('pr_user');
        localStorage.removeItem('pr_guest');
        window.location.href = redirectTo;
    }
};