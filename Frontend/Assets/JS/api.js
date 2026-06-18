const API_BASE = 'http://localhost/PointeResto/Backend/Public/Index.php';

const API = {
    async get(route, params = {}) {
        const url = new URL(API_BASE);
        url.searchParams.append('route', route);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Client Error');
        return await response.json();
    },

    async post(route, data) {
        const url = `${API_BASE}?route=${route}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('API Server Error');
        return await response.json();
    }
};