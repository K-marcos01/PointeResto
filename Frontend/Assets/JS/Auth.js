const Auth = {
    login: async (email, password) => {
        try {
            const res = await API.post('auth', { email, password });
            if (res.token) {
                localStorage.setItem('pr_user', JSON.stringify(res.user));
                return res.user.role;
            }
        } catch (e) { console.error("Échec d'authentification", e); }
        return null;
    },

    registerClient: async (nom, email, password) => {
        return await API.post('auth', { action: 'register', nom, email, password, role: 'client' });
    },

    initClientSession: () => {
        if (!localStorage.getItem('pr_user')) {
            const guestUser = { id_utilisateur: 0, nom: "Anonyme", role: "client" };
            localStorage.setItem('pr_user', JSON.stringify(guestUser));
        }
    },

    getUser: () => {
        Auth.initClientSession();
        return JSON.parse(localStorage.getItem('pr_user'));
    },

    logout: () => {
        localStorage.removeItem('pr_user');
        window.location.href = 'Index.html';
    }
};