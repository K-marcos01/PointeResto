const Auth = {
    login: async (email, password) => {
        const res = await API.post('auth', { email, password });
        if (res.token && res.user) {
            localStorage.setItem('pr_token', res.token);
            localStorage.setItem('pr_user', JSON.stringify(res.user));
            return res.user.role;
        }
        return null;
    },

    register: async (nom, prenom, email, password, role = 'client') => {
        const res = await API.post('auth', {
            action: 'register',
            nom,
            prenom,
            email,
            password,
            role
        });
        if (res.token && res.user) {
            localStorage.setItem('pr_token', res.token);
            localStorage.setItem('pr_user', JSON.stringify(res.user));
        }
        return res;
    },

    getToken: () => {
        return localStorage.getItem('pr_token') || null;
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

    logout: (redirectTo = 'Index.html') => {
        localStorage.removeItem('pr_token');
        localStorage.removeItem('pr_user');
        window.location.href = redirectTo;
    }
};