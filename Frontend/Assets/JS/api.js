// ============================================================
//  API PointeResto
//  En local  → http://localhost:8000/Index.php (Docker Compose)
//  En prod   → URL configurée dans localStorage ('pr_api_url') ou API distante
// ============================================================

const IS_LOCAL = window.location.hostname === 'localhost'
              || window.location.hostname === '127.0.0.1';

const DEFAULT_PROD_URL = 'https://pointeresto-production.up.railway.app';

const API_BASE = localStorage.getItem('pr_api_base')
    || (IS_LOCAL
        ? 'http://localhost:8000/Index.php'
        : `${DEFAULT_PROD_URL}/Index.php`);

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getAuthHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const token = localStorage.getItem('pr_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

const API = {
    async get(route, params = {}) {
        const url = new URL(API_BASE);
        url.searchParams.append('route', route);
        Object.keys(params).forEach(k => {
            if (params[k] !== null && params[k] !== undefined && params[k] !== '') {
                url.searchParams.append(k, params[k]);
            }
        });
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(body.message || `Erreur API GET [${route}] : ${response.status}`);
            err.status = response.status;
            err.body = body;
            throw err;
        }
        return body;
    },

    async post(route, data) {
        const url = `${API_BASE}?route=${encodeURIComponent(route)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(body.message || `Erreur API POST [${route}] : ${response.status}`);
            err.status = response.status;
            err.body = body;
            throw err;
        }
        return body;
    },

    async upload(route, formData) {
        const url = `${API_BASE}?route=${encodeURIComponent(route)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(body.message || `Erreur upload [${route}] : ${response.status}`);
            err.status = response.status;
            err.body = body;
            throw err;
        }
        return body;
    }
};