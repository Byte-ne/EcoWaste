// Full-screen auth page logic
(function () {
    async function apiFetch(path, opts = {}) {
        const base = (window.API && window.API.base) || '/api';
        const res = await fetch(base + path, Object.assign({
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        }, opts));
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, body: json };
    }

    function showLoading(show = true) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (show) {
            loadingScreen.classList.add('active');
            simulateLoadingProgress();
        } else {
            loadingScreen.classList.remove('active');
        }
    }

    function simulateLoadingProgress() {
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            loadingBar.style.width = progress + '%';
            loadingText.textContent = Math.floor(progress) + '%';
            if (progress >= 100) clearInterval(interval);
        }, 300);
    }

    function hideAuthPage() {
        const authPage = document.getElementById('authPage');
        authPage.classList.add('hidden');
    }

    function switchTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        const tab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
        const form = document.getElementById(tabName + 'Tab');

        if (tab) tab.classList.add('active');
        if (form) form.classList.add('active');
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                switchTab(tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('fullscreenLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading();

                const username = document.getElementById('fs-login-username').value.trim();
                const password = document.getElementById('fs-login-password').value;
                const msg = document.getElementById('fs-login-msg');

                try {
                    const res = await apiFetch('/login', {
                        method: 'POST',
                        body: JSON.stringify({ username, password })
                    });

                    setTimeout(() => {
                        if (res.ok && res.body && res.body.success) {
                            msg.textContent = 'Login successful!';
                            msg.classList.add('success');
                            setTimeout(() => {
                                hideAuthPage();
                                showLoading(false);
                                window.location.href = '/index.html';
                            }, 1000);
                        } else {
                            showLoading(false);
                            msg.textContent = res.body?.message || 'Login failed';
                            msg.classList.remove('success');
                        }
                    }, 3000);
                } catch (err) {
                    showLoading(false);
                    msg.textContent = 'Network error';
                }
            });
        }

        // Signup form
        const signupForm = document.getElementById('fullscreenSignupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading();

                const username = document.getElementById('fs-signup-username').value.trim();
                const password = document.getElementById('fs-signup-password').value;
                const password2 = document.getElementById('fs-signup-password2').value;
                const msg = document.getElementById('fs-signup-msg');

                if (password !== password2) {
                    showLoading(false);
                    msg.textContent = 'Passwords do not match';
                    msg.classList.remove('success');
                    return;
                }

                try {
                    const res = await apiFetch('/signup', {
                        method: 'POST',
                        body: JSON.stringify({ username, password })
                    });

                    setTimeout(() => {
                        if (res.ok && res.body && res.body.success) {
                            msg.textContent = 'Account created!';
                            msg.classList.add('success');
                            setTimeout(() => {
                                hideAuthPage();
                                showLoading(false);
                                window.location.href = '/index.html';
                            }, 1000);
                        } else {
                            showLoading(false);
                            msg.textContent = res.body?.message || 'Signup failed';
                            msg.classList.remove('success');
                        }
                    }, 3000);
                } catch (err) {
                    showLoading(false);
                    msg.textContent = 'Network error';
                }
            });
        }
    });
})();
