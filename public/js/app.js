// Common App Logic

let currentUser = null;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function timeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
}

async function logout() {
    try {
        const res = await fetch('/api/logout', { method: 'POST' });
        if (res.ok) {
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
        }
    } catch (e) {
        console.error('Logout error', e);
    }
}

async function checkAuth() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) {
            if (window.location.pathname !== '/login.html') {
                window.location.href = '/login.html';
            }
            return;
        }
        currentUser = await res.json();
        const profileLink = document.getElementById('my-profile-link');
        const sidebarProfileLink = document.getElementById('sidebar-profile-link');
        const sidebarUserLink = document.getElementById('sidebar-user-link');
        const userHandleClean = currentUser.handle.replace('@', '');
        
        if (profileLink) {
            profileLink.href = `/profile.html?handle=${userHandleClean}`;
            profileLink.style.background = currentUser.cover_color || 'var(--primary)';
            profileLink.textContent = currentUser.username[0].toUpperCase();
        }
        if (sidebarProfileLink) {
            sidebarProfileLink.href = `/profile.html?handle=${userHandleClean}`;
        }
        if (sidebarUserLink) {
            sidebarUserLink.href = `/profile.html?handle=${userHandleClean}`;
        }
        
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.style.background = currentUser.cover_color || 'var(--primary)';
            sidebarAvatar.textContent = currentUser.username[0].toUpperCase();
        }
        const sidebarName = document.getElementById('sidebar-name');
        if (sidebarName) {
            sidebarName.textContent = currentUser.username;
        }
        const sidebarHandle = document.getElementById('sidebar-handle');
        if (sidebarHandle) {
            sidebarHandle.textContent = currentUser.handle;
        }
        
        const composeAvatar = document.getElementById('compose-avatar');
        if (composeAvatar) {
            composeAvatar.style.background = currentUser.cover_color || 'var(--primary)';
            composeAvatar.textContent = currentUser.username[0].toUpperCase();
        }
    } catch (e) {
        if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }
}

function createPostHTML(post) {
    const isLiked = post.isLiked > 0;
    const isOwner = currentUser && currentUser.id === post.user_id;
    const time = timeAgo(post.created_at);
    let imageHtml = '';
    if (post.image) {
        imageHtml = `<img src="/uploads/${post.image}" class="post-image" alt="Post Image" onclick="openLightbox('/uploads/${post.image}')">`;
    }
    const bookmarkActive = post.isBookmarked > 0;
    const bookmarkBtn = `<button class="action-btn ${bookmarkActive ? 'active' : ''}" onclick="toggleBookmark(${post.id})">
        <svg width="20" height="20" ${bookmarkActive ? 'style="fill:var(--danger); stroke:var(--danger)"' : ''}>
            <use href="#icon-bookmark"></use>
        </svg>
        <span id="bookmark-count-${post.id}">${post.bookmarksCount}</span> Save
    </button>`;
    const deleteBtn = isOwner ? `<button class="action-btn" onclick="deletePost(${post.id})" title="Delete Post">
        <svg width="20" height="20" style="stroke:var(--danger);">
            <path d="M3 6h18M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12z" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
    </button>` : '';
    
    const avatarColor = post.cover_color || 'var(--primary)';
    const initials = post.username[0].toUpperCase();
    
    return `
        <div class="post" id="post-${post.id}">
            <div class="post-header">
                <a href="/profile.html?handle=${post.handle.replace('@', '')}" style="text-decoration:none;">
                    <div class="avatar" style="background:${avatarColor}">${initials}</div>
                </a>
                <div class="post-meta">
                    <h4><a href="/profile.html?handle=${post.handle.replace('@', '')}">${post.username}</a></h4>
                    <span>${post.handle} • ${time}</span>
                </div>
            </div>
            <div class="post-content">
                ${post.content.replace(/\n/g, '<br>')}
            </div>
            ${imageHtml}
            <div class="post-actions">
                <button class="action-btn ${isLiked ? 'active' : ''}" onclick="toggleLike(${post.id})">
                    <svg width="20" height="20" ${isLiked ? 'style="fill:var(--danger); stroke:var(--danger)"' : ''}>
                        <use href="#icon-heart"></use>
                    </svg>
                    <span id="like-count-${post.id}">${post.likesCount}</span> Likes
                </button>
                <button class="action-btn" onclick="toggleComments(${post.id})">
                    <svg width="20" height="20"><use href="#icon-comment"></use></svg>
                    <span id="comment-count-${post.id}">${post.commentsCount}</span> Comments
                </button>
                ${bookmarkBtn}
                ${deleteBtn}
            </div>
            <div class="comments-section" id="comments-${post.id}">
                <div class="comments-list" id="comments-list-${post.id}"></div>
                <div class="comment-input">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment...">
                    <button onclick="addComment(${post.id})">Post</button>
                </div>
            </div>
        </div>
    `;
}

async function toggleLike(postId) {
    try {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        const data = await res.json();
        
        const btn = document.querySelector(`#post-${postId} .action-btn`);
        const countSpan = document.getElementById(`like-count-${postId}`);
        const svg = btn.querySelector('svg');
        let count = parseInt(countSpan.textContent);

        if (data.liked) {
            btn.classList.add('active');
            svg.style.fill = 'var(--danger)';
            svg.style.stroke = 'var(--danger)';
            count++;
        } else {
            btn.classList.remove('active');
            svg.style.fill = 'none';
            svg.style.stroke = 'currentColor';
            count--;
        }
        countSpan.textContent = count;
    } catch (e) {
        console.error('Error liking post', e);
    }
}

// New: Toggle bookmark (save/unsave post)
async function toggleBookmark(postId) {
    try {
        const res = await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' });
        const data = await res.json();
        const btn = document.querySelector(`#post-${postId} button[onclick*='toggleBookmark']`);
        const countSpan = document.getElementById(`bookmark-count-${postId}`);
        let count = parseInt(countSpan.textContent);
        if (data.bookmarked) {
            btn.classList.add('active');
            btn.querySelector('svg').style.fill = 'var(--danger)';
            btn.querySelector('svg').style.stroke = 'var(--danger)';
            count++;
        } else {
            btn.classList.remove('active');
            btn.querySelector('svg').style.fill = 'none';
            btn.querySelector('svg').style.stroke = 'currentColor';
            count--;
        }
        countSpan.textContent = count;
    } catch (e) {
        console.error('Error toggling bookmark', e);
    }
}

// New: Delete own post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
        if (res.ok) {
            const el = document.getElementById(`post-${postId}`);
            if (el) el.remove();
            // Reload feed to reflect deletion
            loadFeed();
        } else {
            console.error('Failed to delete post');
        }
    } catch (e) {
        console.error('Error deleting post', e);
    }
}


async function loadComments(postId) {
    try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const comments = await res.json();
        const list = document.getElementById(`comments-list-${postId}`);
        list.innerHTML = '';
        comments.forEach(c => {
            const avatarColor = c.cover_color || 'var(--primary)';
            const initials = c.username[0].toUpperCase();
            list.innerHTML += `
                <div class="comment">
                    <div class="comment-header">
                        <div class="avatar" style="width:24px; height:24px; font-size:0.8rem; background:${avatarColor}; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">${initials}</div>
                        <strong>${c.username}</strong>
                        <span style="color:var(--text-muted); font-size:0.8rem">${timeAgo(c.created_at)}</span>
                    </div>
                    <div style="margin-top:0.5rem; font-size:0.95rem">${c.content}</div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section.classList.contains('open')) {
        section.classList.remove('open');
    } else {
        section.classList.add('open');
        loadComments(postId);
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (res.ok) {
            input.value = '';
            loadComments(postId);
            // Updating comment count
            const countSpan = document.getElementById(`comment-count-${postId}`);
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
    } catch (e) {
        console.error('Error adding comment', e);
    }
}

// Lightbox functionality
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (lightbox && img) {
        img.src = src;
        lightbox.classList.add('open');
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Lightbox close binding
    const closeBtn = document.getElementById('lightbox-close');
    const lightbox = document.getElementById('lightbox');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // Nav search input binding
    const navSearch = document.getElementById('nav-search-input');
    if (navSearch) {
        navSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = navSearch.value.trim();
                if (q) {
                    window.location.href = `/explore.html?q=${encodeURIComponent(q)}`;
                }
            }
        });
    }
});

if (window.location.pathname !== '/login.html') {
    checkAuth();
}

