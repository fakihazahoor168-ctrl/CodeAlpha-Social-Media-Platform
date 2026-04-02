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
        const user = data.user;
        const posts = data.posts;

        document.getElementById('profile-name').textContent = user.username;
        document.getElementById('profile-handle').textContent = user.handle;
        document.getElementById('profile-bio').textContent = user.bio;
        document.getElementById('profile-avatar-initial').textContent = user.username[0].toUpperCase();
        
        document.getElementById('profile-followers').textContent = user.followers;
        document.getElementById('profile-following').textContent = user.following;
        document.getElementById('profile-posts-count').textContent = posts.length;

        const followBtn = document.getElementById('follow-btn');
        if (currentUser && currentUser.id !== user.id) {
            followBtn.style.display = 'inline-block';
            if (user.isFollowing > 0) {
                followBtn.textContent = 'Unfollow';
                followBtn.classList.add('btn-outline');
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('btn-outline');
            }
            
            followBtn.onclick = () => toggleFollow(handle);
        } else {
            followBtn.style.display = 'none';
        }

        const container = document.getElementById('posts-container');
        if (posts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No posts yet.</div>';
        } else {
            container.innerHTML = posts.map(createPostHTML).join('');
        }
        
        document.getElementById('profile-content').style.display = 'block';
    } catch (e) {
        console.error('Failed to load profile', e);
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
        } else {
            followBtn.textContent = 'Follow';
            followBtn.classList.remove('btn-outline');
            count--;
        }
        followersCount.textContent = count;
    } catch (e) {
        console.error('Error toggling follow', e);
    }
}
