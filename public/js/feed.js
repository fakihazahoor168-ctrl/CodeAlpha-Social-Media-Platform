document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
    loadTrending();
    loadSuggested();

    const postForm = document.getElementById('create-post-form');
    const contentArea = document.getElementById('post-content');
    const charCounter = document.getElementById('char-counter');
    const fileInput = document.getElementById('post-image');
    const previewWrap = document.getElementById('image-preview-wrap');
    const previewImg = document.getElementById('image-preview-img');
    const removeImgBtn = document.getElementById('remove-image-btn');

    // Live character counter
    if (contentArea && charCounter) {
        contentArea.addEventListener('input', () => {
            const len = contentArea.value.length;
            charCounter.textContent = `${len} / 500`;
            if (len >= 500) {
                charCounter.style.color = 'var(--danger)';
            } else {
                charCounter.style.color = 'var(--text-muted)';
            }
        });
    }

    // Image preview handler
    if (fileInput && previewWrap && previewImg) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImg.src = event.target.result;
                    previewWrap.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Remove image preview
    if (removeImgBtn && fileInput && previewWrap && previewImg) {
        removeImgBtn.addEventListener('click', () => {
            fileInput.value = '';
            previewImg.src = '';
            previewWrap.style.display = 'none';
        });
    }

    // Form submit
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = contentArea.value.trim();
            const formData = new FormData();
            formData.append('content', content);
            if (fileInput.files[0]) {
                formData.append('image', fileInput.files[0]);
            }

            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    contentArea.value = '';
                    fileInput.value = '';
                    if (charCounter) charCounter.textContent = '0 / 500';
                    if (previewWrap) {
                        previewWrap.style.display = 'none';
                        previewImg.src = '';
                    }
                    if (typeof showToast === 'function') {
                        showToast('Post created successfully!', 'success');
                    }
                    loadFeed();
                    loadTrending();
                } else {
                    const data = await res.json();
                    if (typeof showToast === 'function') {
                        showToast(data.error || 'Failed to create post', 'error');
                    }
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') {
                    showToast('Server error while posting', 'error');
                }
            }
        });
    }
});

async function loadFeed() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    // Show skeletons
    container.innerHTML = `
        <div class="skeleton skeleton-card" style="height: 180px; margin-bottom: 1.5rem;"></div>
        <div class="skeleton skeleton-card" style="height: 180px; margin-bottom: 1.5rem;"></div>
    `;

    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        
        if (posts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 3rem;">No posts yet. Be the first to share something!</div>';
            return;
        }
        
        container.innerHTML = posts.map(createPostHTML).join('');
    } catch (e) {
        console.error('Failed to load feed', e);
        container.innerHTML = '<div style="text-align: center; color: var(--danger); padding: 3rem;">Failed to load posts feed.</div>';
    }
}

async function loadTrending() {
    const list = document.getElementById('trending-list');
    if (!list) return;
    try {
        const res = await fetch('/api/posts/trending');
        const posts = await res.json();
        
        if (posts.length === 0) {
            list.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">No trending posts.</div>';
            return;
        }
        
        list.innerHTML = posts.map(post => {
            const initials = post.username[0].toUpperCase();
            const color = post.cover_color || 'var(--primary)';
            return `
                <div class="trending-item" onclick="window.location.href='/profile.html?handle=${post.handle.replace('@', '')}'" style="cursor:pointer; display:flex; gap:0.5rem; margin-bottom:0.75rem;">
                    <div class="avatar avatar-sm" style="background:${color}; display:flex; align-items:center; justify-content:center; color:white; font-size:0.8rem; font-weight:bold; min-width:28px; height:28px;">${initials}</div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.content}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${post.handle} • 🔥 ${post.likesCount}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}

async function loadSuggested() {
    const list = document.getElementById('suggested-list');
    if (!list) return;
    try {
        const res = await fetch('/api/users/suggested');
        const users = await res.json();
        
        if (users.length === 0) {
            list.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">No suggestions available.</div>';
            return;
        }
        
        list.innerHTML = users.map(user => {
            const initials = user.username[0].toUpperCase();
            const color = user.cover_color || 'var(--primary)';
            return `
                <div class="suggested-user">
                    <a href="/profile.html?handle=${user.handle.replace('@', '')}" style="text-decoration:none;">
                        <div class="avatar avatar-sm" style="background:${color}; display:flex; align-items:center; justify-content:center; color:white; font-size:0.8rem; font-weight:bold;">${initials}</div>
                    </a>
                    <div class="suggested-user-info" onclick="window.location.href='/profile.html?handle=${user.handle.replace('@', '')}'" style="cursor:pointer;">
                        <div class="name">${user.username}</div>
                        <div class="handle">${user.handle}</div>
                    </div>
                    <button class="btn-follow-sm" onclick="toggleFollowSidebar(event, '${user.handle}', this)">Follow</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}

async function toggleFollowSidebar(event, handle, btn) {
    event.stopPropagation();
    try {
        const res = await fetch(`/api/profile/${handle}/follow`, { method: 'POST' });
        const data = await res.json();
        
        if (data.followed) {
            btn.textContent = 'Following';
            btn.classList.add('following');
            if (typeof showToast === 'function') showToast(`You followed ${handle}`);
        } else {
            btn.textContent = 'Follow';
            btn.classList.remove('following');
            if (typeof showToast === 'function') showToast(`You unfollowed ${handle}`);
        }
        
        // Reload suggested list
        loadSuggested();
    } catch (e) {
        console.error(e);
    }
}
