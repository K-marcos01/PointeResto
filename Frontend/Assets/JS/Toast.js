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

        const iconSpan = document.createElement('span');
        iconSpan.className = 'toast-icon';
        iconSpan.textContent = icons[type] || icons.info;

        const msgSpan = document.createElement('span');
        msgSpan.textContent = String(message ?? '');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Fermer');
        closeBtn.textContent = '×';

        toast.appendChild(iconSpan);
        toast.appendChild(msgSpan);
        toast.appendChild(closeBtn);

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        const remove = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        };

        closeBtn.addEventListener('click', remove);
        if (duration > 0) setTimeout(remove, duration);
    },

    success(msg, duration) { this.show(msg, 'success', duration); },
    error(msg, duration)   { this.show(msg, 'error', duration); },
    info(msg, duration)    { this.show(msg, 'info', duration); }
};