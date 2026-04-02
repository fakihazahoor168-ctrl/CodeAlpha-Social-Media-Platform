// Auth Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

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
            const handle = document.getElementById('login-handle').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handle, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                
                // Save user info locally for quick access
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/';
            } catch (err) {
                alert(err.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            let handle = document.getElementById('reg-handle').value;
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
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                
                alert('Registered successfully! Please log in.');
                registerContainer.classList.add('hidden');
                loginContainer.classList.remove('hidden');
            } catch (err) {
                alert(err.message);
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
