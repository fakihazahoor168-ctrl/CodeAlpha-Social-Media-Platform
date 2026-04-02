// Common App Logic

let currentUser = null;

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
        if (profileLink) {
            profileLink.href = `/profile.html?handle=${currentUser.handle.replace('@', '')}`;
        }
    } catch (e) {
        if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }
}

function createPostHTML(post) {
    const isLiked = post.isLiked > 0;
    const time = new Date(post.created_at).toLocaleString();
    let imageHtml = '';
    if (post.image) {
        imageHtml = `<img src="/uploads/${post.image}" class="post-image" alt="Post Request">`;
    }

    return `
        <div class="post" id="post-${post.id}">
            <div class="post-header">
                <a href="/profile.html?handle=${post.handle.replace('@', '')}" style="text-decoration:none;">
                    <div class="avatar">${post.username[0].toUpperCase()}</div>
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
                    <svg width="20" height="20" ${isLiked ? 'style="fill:var(--danger); stroke:var(--danger)"' : ''}><use href="#icon-heart"></use></svg>
                    <span id="like-count-${post.id}">${post.likesCount}</span> Likes
                </button>
                <button class="action-btn" onclick="toggleComments(${post.id})">
                    <svg width="20" height="20"><use href="#icon-comment"></use></svg>
                    <span id="comment-count-${post.id}">${post.commentsCount}</span> Comments
                </button>
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

async function loadComments(postId) {
    try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const comments = await res.json();
        const list = document.getElementById(`comments-list-${postId}`);
        list.innerHTML = '';
        comments.forEach(c => {
            list.innerHTML += `
                <div class="comment">
                    <div class="comment-header">
                        <div class="avatar" style="width:24px; height:24px; font-size:0.8rem">${c.username[0].toUpperCase()}</div>
                        <strong>${c.username}</strong>
                        <span style="color:var(--text-muted); font-size:0.8rem">${new Date(c.created_at).toLocaleString()}</span>
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

if (window.location.pathname !== '/login.html') {
    checkAuth();
}
