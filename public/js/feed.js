document.addEventListener('DOMContentLoaded', () => {
    loadFeed();

    const postForm = document.getElementById('create-post-form');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = document.getElementById('post-content').value;
            const fileInput = document.getElementById('post-image');
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
                    document.getElementById('post-content').value = '';
                    fileInput.value = '';
                    
                    // Reset file UI
                    const fileNameSpan = document.getElementById('file-name');
                    if (fileNameSpan) {
                        fileNameSpan.textContent = 'Attach Photo';
                        fileNameSpan.parentElement.classList.remove('has-file');
                    }
                    
                    loadFeed(); // Reload
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    const fileInput = document.getElementById('post-image');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const fileNameSpan = document.getElementById('file-name');
            if (e.target.files && e.target.files[0]) {
                const name = e.target.files[0].name;
                fileNameSpan.textContent = name.length > 20 ? name.substring(0, 20) + '...' : name;
                fileNameSpan.parentElement.classList.add('has-file');
            } else {
                fileNameSpan.textContent = 'Attach Photo';
                fileNameSpan.parentElement.classList.remove('has-file');
            }
        });
    }
});

async function loadFeed() {
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        const container = document.getElementById('posts-container');
        if (posts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No posts yet. Be the first to share something!</div>';
            return;
        }
        
        container.innerHTML = posts.map(createPostHTML).join('');
    } catch (e) {
        console.error('Failed to load feed', e);
    }
}
