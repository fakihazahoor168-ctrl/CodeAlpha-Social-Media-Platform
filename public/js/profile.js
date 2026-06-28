let profileUser = null; // Store user details for this profile page
let currentTab = 'posts'; // Store current active tab ('posts' or 'bookmarks')

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let handle = urlParams.get('handle');
    
    // Default to current user if handle wasn't passed, though it should be handled defensively
    if (!handle) {
        if (currentUser) {
            handle = currentUser.handle.replace('@', '');
        } else {
            // Need to wait for auth check
            await new Promise(resolve => setTimeout(resolve, 500));
            if (currentUser) handle = currentUser.handle.replace('@', '');
        }
    }

    if (!handle) {
        window.location.href = '/';
        return;
    }

    loadProfile('@' + handle);
    setupEditProfileModal();
    setupTabs(handle);
});

async function loadProfile(handle) {
    try {
        const res = await fetch(`/api/profile/${handle}`);
        if (!res.ok) {
            document.getElementById('posts-container').innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">User not found.</div>';
            document.getElementById('profile-content').style.display = 'block';
            return;
        }

        const data = await res.json();
        profileUser = data.user;
        const posts = data.posts;

        // Set text content
        document.getElementById('profile-name').textContent = profileUser.username;
        document.getElementById('profile-handle').textContent = profileUser.handle;
        document.getElementById('profile-bio').textContent = profileUser.bio || 'No bio yet.';
        
        // Avatar Initial and Cover Styling
        const avatarEl = document.getElementById('profile-avatar-initial');
        if (avatarEl) {
            avatarEl.textContent = profileUser.username[0].toUpperCase();
            avatarEl.style.background = profileUser.cover_color || 'var(--primary)';
        }
        
        const coverEl = document.getElementById('profile-cover');
        if (coverEl) {
            coverEl.style.backgroundColor = profileUser.cover_color || 'var(--primary)';
        }

        document.getElementById('profile-followers').textContent = profileUser.followers;
        document.getElementById('profile-following').textContent = profileUser.following;
        document.getElementById('profile-posts-count').textContent = posts.length;

        // Render Action Buttons
        const followBtn = document.getElementById('follow-btn');
        const editBtn = document.getElementById('edit-profile-btn');
        const bookmarksTab = document.getElementById('tab-bookmarks');

        if (currentUser && currentUser.id !== profileUser.id) {
            // Viewing someone else's profile
            followBtn.classList.remove('hidden');
            editBtn.classList.add('hidden');
            if (bookmarksTab) bookmarksTab.classList.add('hidden'); // Hide saved posts tab for others
            
            if (profileUser.isFollowing > 0) {
                followBtn.textContent = 'Unfollow';
                followBtn.classList.add('btn-outline');
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('btn-outline');
            }
            
            followBtn.onclick = () => toggleFollow(handle);
        } else {
            // Viewing own profile
            followBtn.classList.add('hidden');
            editBtn.classList.remove('hidden');
            if (bookmarksTab) bookmarksTab.classList.remove('hidden'); // Show saved posts tab for self
        }

        // Render default tab content (Posts)
        currentTab = 'posts';
        renderTabContent(posts);
        
        document.getElementById('profile-content').style.display = 'block';
    } catch (e) {
        console.error('Failed to load profile', e);
    }
}

function renderTabContent(posts) {
    const container = document.getElementById('posts-container');
    if (posts.length === 0) {
        if (currentTab === 'bookmarks') {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 3rem;">You haven\'t saved any posts yet.</div>';
        } else {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 3rem;">No posts yet.</div>';
        }
    } else {
        container.innerHTML = posts.map(createPostHTML).join('');
    }
}

async function loadSavedPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = `
        <div class="skeleton skeleton-card" style="height: 180px; margin-bottom: 1.5rem;"></div>
        <div class="skeleton skeleton-card" style="height: 180px; margin-bottom: 1.5rem;"></div>
    `;
    try {
        const res = await fetch('/api/bookmarks');
        if (res.ok) {
            const posts = await res.json();
            renderTabContent(posts);
        } else {
            container.innerHTML = '<div style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load saved posts.</div>';
        }
    } catch (e) {
        console.error('Failed to load bookmarks', e);
        container.innerHTML = '<div style="text-align: center; color: var(--danger); padding: 2rem;">Error loading saved posts.</div>';
    }
}

async function loadUserPosts() {
    if (!profileUser) return;
    const container = document.getElementById('posts-container');
    container.innerHTML = `
        <div class="skeleton skeleton-card" style="height: 180px; margin-bottom: 1.5rem;"></div>
    `;
    try {
        const res = await fetch(`/api/profile/${profileUser.handle}`);
        const data = await res.json();
        renderTabContent(data.posts);
    } catch (e) {
        console.error('Failed to reload profile posts', e);
    }
}

async function toggleFollow(handle) {
    try {
        const res = await fetch(`/api/profile/${handle}/follow`, { method: 'POST' });
        const data = await res.json();
        
        const followBtn = document.getElementById('follow-btn');
        const followersCount = document.getElementById('profile-followers');
        let count = parseInt(followersCount.textContent);

        if (data.followed) {
            followBtn.textContent = 'Unfollow';
            followBtn.classList.add('btn-outline');
            count++;
            if (typeof showToast === 'function') showToast(`You followed ${handle}`);
        } else {
            followBtn.textContent = 'Follow';
            followBtn.classList.remove('btn-outline');
            count--;
            if (typeof showToast === 'function') showToast(`You unfollowed ${handle}`);
        }
        followersCount.textContent = count;
    } catch (e) {
        console.error('Error toggling follow', e);
    }
}

function setupEditProfileModal() {
    const modal = document.getElementById('edit-modal');
    const editBtn = document.getElementById('edit-profile-btn');
    const closeBtn = document.getElementById('edit-modal-close');
    const form = document.getElementById('edit-profile-form');
    
    if (!modal) return;

    // Open Modal
    editBtn.addEventListener('click', () => {
        document.getElementById('edit-name').value = profileUser.username;
        document.getElementById('edit-bio').value = profileUser.bio || '';
        modal.classList.add('open');
    });

    // Close Modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    // Submit Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('edit-name').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, bio })
            });

            if (res.ok) {
                if (typeof showToast === 'function') showToast('Profile updated successfully!', 'success');
                modal.classList.remove('open');
                
                // Refresh local user state and reload profile details
                if (typeof checkAuth === 'function') await checkAuth();
                loadProfile(profileUser.handle);
            } else {
                const errData = await res.json();
                if (typeof showToast === 'function') showToast(errData.error || 'Failed to update profile', 'error');
            }
        } catch (e) {
            console.error('Profile update error', e);
            if (typeof showToast === 'function') showToast('Server error while saving changes', 'error');
        }
    });
}

function setupTabs(handle) {
    const postsTab = document.getElementById('tab-posts');
    const bookmarksTab = document.getElementById('tab-bookmarks');

    if (!postsTab || !bookmarksTab) return;

    postsTab.addEventListener('click', () => {
        if (currentTab === 'posts') return;
        currentTab = 'posts';
        postsTab.classList.add('active');
        bookmarksTab.classList.remove('active');
        loadUserPosts();
    });

    bookmarksTab.addEventListener('click', () => {
        if (currentTab === 'bookmarks') return;
        currentTab = 'bookmarks';
        bookmarksTab.classList.add('active');
        postsTab.classList.remove('active');
        loadSavedPosts();
    });
}
