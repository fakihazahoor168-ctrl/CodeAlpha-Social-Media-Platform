// Auth Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

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

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const handle = document.getElementById('login-handle').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handle, password })
                });
                
                let data = {};
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json();
                } else {
                    const text = await res.text();
                    throw new Error(text || 'A server error occurred (Non-JSON response).');
                }
                
                if (!res.ok) throw new Error(data.error || 'Server error occurred during login');
                
                showToast('Login successful! Redirecting...', 'success');
                localStorage.setItem('user', JSON.stringify(data.user));
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } catch (err) {
                showToast(err.message || 'Login failed', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value.trim();
            let handle = document.getElementById('reg-handle').value.trim();
            const password = document.getElementById('reg-password').value;

            if (!handle.startsWith('@')) {
                handle = '@' + handle;
            }

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, handle, password })
                });
                
                let data = {};
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json();
                } else {
                    const text = await res.text();
                    throw new Error(text || 'A server error occurred (Non-JSON response).');
                }
                
                if (!res.ok) throw new Error(data.error || 'Server error occurred during registration');
                
                showToast('Registered successfully! Please log in.', 'success');
                setTimeout(() => {
                    registerContainer.classList.add('hidden');
                    loginContainer.classList.remove('hidden');
                }, 1500);
            } catch (err) {
                showToast(err.message || 'Registration failed', 'error');
            }
        });
    }
});

// Logout handler
window.logout = async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    } catch (err) {
        console.error(err);
    }
};
