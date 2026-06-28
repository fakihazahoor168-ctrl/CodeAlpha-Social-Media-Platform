document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    
    const searchInput = document.getElementById('explore-search-input');
    const resultsSection = document.getElementById('search-results-section');
    const resultsList = document.getElementById('search-results-list');
    
    if (initialQuery) {
        searchInput.value = initialQuery;
        performSearch(initialQuery);
    }
    
    // Setup debounced search typing
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (query.length === 0) {
            resultsSection.style.display = 'none';
            resultsList.innerHTML = '';
            return;
        }
        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    loadSuggestedExplore();
    loadTrendingExplore();
});

async function performSearch(query) {
    const resultsSection = document.getElementById('search-results-section');
    const resultsList = document.getElementById('search-results-list');
    
    resultsSection.style.display = 'block';
    resultsList.innerHTML = `
        <div class="skeleton skeleton-line skeleton-w-full"></div>
        <div class="skeleton skeleton-line skeleton-w-full"></div>
    `;
    
    try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const users = await res.json();
        
        if (users.length === 0) {
            resultsList.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No users found matching that search.</div>';
            return;
        }
        
        // Find who we follow by calling a helper or check if backend already returned isFollowing
        // Wait, the backend `/api/users/search` endpoint returned:
        // SELECT id, username, handle, bio, cover_color,
        // (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers
        // Wait! We need to know if the CURRENT user is following this search result user.
        // Let's modify the backend search endpoint to return `isFollowing` so it's super easy!
        // Wait, does `/api/users/search` return if we follow them? In server.js line 339, it doesn't.
        // Let's check how we can fetch who we follow or check it. Better yet, let's update server.js to return isFollowing in search results!
        // We'll update server.js in a moment. Let's write the display code assuming `isFollowing` is returned.
        
        resultsList.innerHTML = users.map(user => {
            const avatarColor = user.cover_color || 'var(--primary)';
            const initials = user.username[0].toUpperCase();
            const followBtnText = user.isFollowing > 0 ? 'Unfollow' : 'Follow';
            const followBtnClass = user.isFollowing > 0 ? 'btn btn-sm btn-outline' : 'btn btn-sm';
            
            return `
                <div class="user-card">
                    <a href="/profile.html?handle=${user.handle.replace('@', '')}" style="text-decoration:none;">
                        <div class="avatar" style="background:${avatarColor}; min-width:40px; height:40px; font-weight:bold; font-size:1.1rem; display:flex; align-items:center; justify-content:center;">${initials}</div>
                    </a>
                    <div class="user-card-info" onclick="window.location.href='/profile.html?handle=${user.handle.replace('@', '')}'">
                        <div class="name">${user.username}</div>
                        <div class="handle">${user.handle}</div>
                        <div class="bio">${user.bio || ''}</div>
                    </div>
                    <button class="${followBtnClass}" onclick="toggleFollowExplore(event, '${user.handle}', this)">${followBtnText}</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Search error', e);
        resultsList.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--danger);">Failed to load results.</div>';
    }
}

async function loadSuggestedExplore() {
    const list = document.getElementById('suggested-users-list');
    try {
        const res = await fetch('/api/users/suggested');
        const users = await res.json();
        
        if (users.length === 0) {
            list.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 0.5rem 0;">No suggestions available.</div>';
            return;
        }
        
        list.innerHTML = users.map(user => {
            const avatarColor = user.cover_color || 'var(--primary)';
            const initials = user.username[0].toUpperCase();
            // Note: backend suggested users is always users we do NOT follow, so they are not followed yet.
            return `
                <div class="user-card">
                    <a href="/profile.html?handle=${user.handle.replace('@', '')}" style="text-decoration:none;">
                        <div class="avatar" style="background:${avatarColor}; min-width:40px; height:40px; font-weight:bold; font-size:1.1rem; display:flex; align-items:center; justify-content:center;">${initials}</div>
                    </a>
                    <div class="user-card-info" onclick="window.location.href='/profile.html?handle=${user.handle.replace('@', '')}'">
                        <div class="name">${user.username}</div>
                        <div class="handle">${user.handle}</div>
                        <div class="bio">${user.bio || ''}</div>
                    </div>
                    <button class="btn btn-sm" onclick="toggleFollowExplore(event, '${user.handle}', this)">Follow</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Failed to load suggestions', e);
        list.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">Failed to load suggestions.</div>';
    }
}

async function loadTrendingExplore() {
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

async function toggleFollowExplore(event, handle, btn) {
    event.stopPropagation();
    try {
        const res = await fetch(`/api/profile/${handle}/follow`, { method: 'POST' });
        const data = await res.json();
        
        if (data.followed) {
            btn.textContent = 'Unfollow';
            btn.className = 'btn btn-sm btn-outline';
            if (typeof showToast === 'function') showToast(`You followed ${handle}`);
        } else {
            btn.textContent = 'Follow';
            btn.className = 'btn btn-sm';
            if (typeof showToast === 'function') showToast(`You unfollowed ${handle}`);
        }
        
        // Reload suggestions since we followed/unfollowed someone
        loadSuggestedExplore();
    } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast('Error following user', 'error');
    }
}
