//  API PointeResto
//  En local  → http://localhost/PointeResto/Backend/Public/Index.php
//  En prod   → backend Railway (sert Backend/Public comme racine)

// Détection automatique : local vs production (GitHub Pages)
const IS_LOCAL = window.location.hostname === 'localhost'
              || window.location.hostname === '127.0.0.1';

const RAILWAY_URL = 'https://pointeresto-production.up.railway.app';

const API_BASE = IS_LOCAL
    ? 'http://localhost/PointeResto/Backend/Public/Index.php'
    : `${RAILWAY_URL}/Index.php`;

const API = {
    async get(route, params = {}) {
        const url = new URL(API_BASE);
        url.searchParams.append('route', route);
        Object.keys(params).forEach(k => {
            if (params[k] !== null && params[k] !== undefined && params[k] !== '') {
                url.searchParams.append(k, params[k]);
            }
        });
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erreur API GET [${route}] : ${response.status}`);
        return await response.json();
    },

    async post(route, data) {
        const url = `${API_BASE}?route=${route}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Erreur API POST [${route}] : ${response.status}`);
        return await response.json();
    }
};
