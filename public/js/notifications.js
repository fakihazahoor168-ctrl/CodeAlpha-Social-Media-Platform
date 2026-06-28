// notifications.js – handles loading and rendering user notifications

// Utility to format timestamps (e.g., "2h ago")
function timeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
}

// Load notifications from the API and render them into the panel
async function loadNotifications() {
    try {
        const res = await fetch('/api/notifications', { method: 'GET' });
        const notifs = await res.json();
        const listEl = document.getElementById('notif-list');
        listEl.innerHTML = '';
        notifs.forEach(n => {
            const typeLabel = n.type.charAt(0).toUpperCase() + n.type.slice(1);
            const fromName = n.from_username || 'Someone';
            const item = document.createElement('div');
            item.className = 'notif-item';
            item.innerHTML = `
                <div class="notif-header">
                    <strong>${fromName}</strong> ${typeLabel} your post
                </div>
                <div class="notif-body">
                    ${n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'follow' ? '👤' : ''}
                </div>
                <div class="notif-time">${timeAgo(n.created_at)}</div>
            `;
            listEl.appendChild(item);
        });
        // Update badge count
        const badge = document.getElementById('notif-badge');
        const countRes = await fetch('/api/notifications/count');
        const { count } = await countRes.json();
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (e) {
        console.error('Failed to load notifications', e);
    }
}

// Mark all notifications as read
async function markAllRead() {
    try {
        await fetch('/api/notifications/read', { method: 'POST' });
        const badge = document.getElementById('notif-badge');
        badge.classList.add('hidden');
    } catch (e) {
        console.error('Failed to mark notifications as read', e);
    }
}

// Attach listeners when DOM is ready (if this script loads after app.js)
document.addEventListener('DOMContentLoaded', () => {
    const notifBtn = document.getElementById('notif-btn');
    const panel = document.getElementById('notif-panel');
    if (notifBtn && panel) {
        notifBtn.addEventListener('click', () => {
            panel.classList.toggle('open');
            if (panel.classList.contains('open')) {
                loadNotifications();
            }
        });
    }
    const markReadBtn = document.getElementById('mark-read-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', markAllRead);
    }
});
