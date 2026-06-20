// ============================================================
//  Toast — notifications non-bloquantes (remplace alert())
// ============================================================
const Toast = {
    _ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    },

    show(message, type = 'info', duration = 3500) {
        const container = this._ensureContainer();
        const icons = { success: '✓', error: '✕', info: 'i' };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button class="toast-close" aria-label="Fermer">×</button>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        const remove = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('.toast-close').addEventListener('click', remove);
        if (duration > 0) setTimeout(remove, duration);
    },

    success(msg, duration) { this.show(msg, 'success', duration); },
    error(msg, duration)   { this.show(msg, 'error', duration); },
    info(msg, duration)    { this.show(msg, 'info', duration); }
};
