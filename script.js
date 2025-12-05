// Main auth and navigation logic
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

    async function checkAuthStatus() {
        try {
            const res = await apiFetch('/me');
            if (res.ok && res.body && res.body.user) {
                return res.body.user;
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        }
        return null;
    }

    function showAuthSection() {
        const userSection = document.getElementById('userSection');
        const profileSection = document.getElementById('profileSection');
        if (userSection) userSection.classList.remove('hidden');
        if (profileSection) profileSection.classList.add('hidden');
    }

    function showProfileSection(username) {
        const userSection = document.getElementById('userSection');
        const profileSection = document.getElementById('profileSection');
        const profileUsername = document.getElementById('profileUsername');

        if (userSection) userSection.classList.add('hidden');
        if (profileSection) profileSection.classList.remove('hidden');
        if (profileUsername) profileUsername.textContent = username;
    }

    function showTab(tabName) {
        document.querySelectorAll('.auth-tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        const content = document.getElementById('auth' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab');
        if (content) content.classList.add('active');
        const tab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
        if (tab) tab.classList.add('active');
    }

    function safeText(el, txt) { if (el) el.textContent = txt; }

    document.addEventListener('DOMContentLoaded', async () => {
        // Smooth navigation: show enter animation
        try {
            document.body.classList.add('page-visible');
            // force reflow to ensure transition (in some browsers)
            void document.body.offsetWidth;
        } catch (e) { }

        // Intercept internal link clicks for smooth exit animation
        function isInternalLink(a) {
            try {
                const url = new URL(a.href, location.href);
                return url.origin === location.origin && url.pathname !== location.pathname;
            } catch (e) { return false; }
        }

        async function navigateWithAnimation(href) {
            document.body.classList.add('page-exit');
            // small delay to let the animation run
            const delay = 360;
            await new Promise(r => setTimeout(r, delay));
            location.href = href;
        }

        document.addEventListener('click', (ev) => {
            const a = ev.target.closest && ev.target.closest('a');
            if (!a) return;
            if (a.target && a.target === '_blank') return; // external open in new tab
            if (a.hasAttribute('download')) return; // allow downloads
            if (!a.href) return;
            if (a.href.indexOf('javascript:') === 0) return;

            // Try to handle same-page anchors with smooth scroll first,
            // otherwise handle internal-page navigation with exit animation.
            try {
                const url = new URL(a.href, location.href);
                if (url.origin === location.origin) {
                    // Same-page anchor (hash only)
                    if (url.pathname === location.pathname && url.hash && url.hash !== '#') {
                        ev.preventDefault();
                        try {
                            const selector = decodeURIComponent(url.hash);
                            const targetEl = document.querySelector(selector);
                            if (targetEl) {
                                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                try { history.pushState(null, '', url.hash); } catch (e) { }
                                return;
                            }
                        } catch (e) {
                            // fall through to default navigation if selector invalid
                        }
                        // If target not found, fall back to normal navigation
                        return;
                    }

                    // Internal link to a different page on same origin: animate exit then navigate
                    if (url.pathname !== location.pathname) {
                        ev.preventDefault();
                        navigateWithAnimation(a.href);
                        return;
                    }
                }
            } catch (e) {
                // ignore URL parse errors and allow default behavior
            }
        }, true);

        // when the page is unloading via browser controls, add exit class for smoothness
        window.addEventListener('beforeunload', () => {
            try { document.body.classList.add('page-exit'); } catch (e) { }
        });

        // Check auth status on page load
        const user = await checkAuthStatus();

        if (!user) {
            // User not logged in - redirect to auth page
            window.location.href = '/auth-fullscreen.html';
            return;
        }

        // User is logged in
        showProfileSection(user.username);

        // Profile dropdown logic
        const profileIcon = document.querySelector('.profile-icon');
        const profileMenu = document.getElementById('profileMenu');

        if (profileIcon) {
            profileIcon.addEventListener('click', () => {
                if (profileMenu) {
                    profileMenu.classList.toggle('hidden');
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await apiFetch('/logout', { method: 'POST' });
                window.location.href = '/auth-fullscreen.html';
            });
        }

        // Close profile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (profileIcon && !e.target.closest('.profile-container')) {
                if (profileMenu) profileMenu.classList.add('hidden');
            }
        });

        // Modal auth button (for backup access)
        const authBtn = document.getElementById('authBtn');
        const authModal = document.getElementById('authModal');
        const closeAuthModal = document.getElementById('closeAuthModal');
        const authTabButtons = document.querySelectorAll('.auth-tab');

        if (authBtn) {
            authBtn.addEventListener('click', () => {
                if (authModal) {
                    authModal.classList.add('active');
                    showTab('login');
                }
            });
        }

        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => {
                if (authModal) authModal.classList.remove('active');
            });
        }

        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) authModal.classList.remove('active');
            });
        }

        authTabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                showTab(tab);
            });
        });

        // Index Login Form (backup modal)
        const indexLoginForm = document.getElementById('indexLoginForm');
        if (indexLoginForm) {
            indexLoginForm.addEventListener('submit', async ev => {
                ev.preventDefault();
                const username = document.getElementById('index-login-username').value.trim();
                const password = document.getElementById('index-login-password').value;
                const msg = document.getElementById('index-login-msg');
                const r = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
                if (r.ok && r.body && r.body.success) {
                    safeText(msg, 'Login successful!');
                    msg.classList.add('success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    safeText(msg, r.body?.message || 'Login failed');
                    msg.classList.remove('success');
                }
            });
        }

        // Index Signup Form (backup modal)
        const indexSignupForm = document.getElementById('indexSignupForm');
        if (indexSignupForm) {
            indexSignupForm.addEventListener('submit', async ev => {
                ev.preventDefault();
                const username = document.getElementById('index-signup-username').value.trim();
                const password = document.getElementById('index-signup-password').value;
                const password2 = document.getElementById('index-signup-password2').value;
                const msg = document.getElementById('index-signup-msg');
                if (password !== password2) {
                    safeText(msg, 'Passwords do not match');
                    msg.classList.remove('success');
                    return;
                }
                const r = await apiFetch('/signup', { method: 'POST', body: JSON.stringify({ username, password }) });
                if (r.ok && r.body && r.body.success) {
                    safeText(msg, 'Account created!');
                    msg.classList.add('success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    safeText(msg, r.body?.message || 'Signup failed');
                    msg.classList.remove('success');
                }
            });
        }
    });
})();
