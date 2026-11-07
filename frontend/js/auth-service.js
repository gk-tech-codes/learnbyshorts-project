/**
 * LearnByShorts authentication client.
 *
 * Production authentication is intentionally fail-closed: no mock users,
 * synthetic tokens, or placeholder API endpoints are accepted.
 */
class AuthService {
    constructor() {
        this.apiBaseUrl = this.readMeta('api-base-url').replace(/\/+$/, '');
        this.googleClientId = this.readMeta('google-client-id');
        this.currentUser = null;
        this.token = sessionStorage.getItem('auth_token');
        this.googleInitialized = false;
        this.initialized = this.init();
    }

    readMeta(name) {
        return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
    }

    isConfigured() {
        try {
            const url = new URL(this.apiBaseUrl);
            return url.protocol === 'https:' &&
                !url.hostname.includes('your-') &&
                this.googleClientId.endsWith('.apps.googleusercontent.com');
        } catch {
            return false;
        }
    }

    async init() {
        if (!this.isConfigured()) {
            this.clearSession();
            this.triggerAuthEvent('unavailable', null);
            return;
        }

        if (this.token) {
            await this.verifyToken();
        }

        await this.waitForGoogle();
        if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
                client_id: this.googleClientId,
                callback: response => this.handleGoogleResponse(response),
                auto_select: false,
                cancel_on_tap_outside: true
            });
            this.googleInitialized = true;
            this.triggerAuthEvent('ready', this.currentUser);
        }
    }

    async waitForGoogle() {
        for (let attempt = 0; attempt < 40 && !window.google; attempt += 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async request(path, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('Sign-in is not configured.');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(`${this.apiBaseUrl}${path}`, {
                ...options,
                credentials: 'omit',
                cache: 'no-store',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Authentication request failed.');
            }
            return data;
        } finally {
            clearTimeout(timeout);
        }
    }

    async handleGoogleResponse(response) {
        if (!response?.credential) {
            this.triggerAuthEvent('error', { message: 'Google did not return a credential.' });
            return false;
        }

        try {
            const result = await this.request('/auth/google', {
                method: 'POST',
                body: JSON.stringify({ credential: response.credential })
            });
            if (!result.token || !result.user) {
                throw new Error('The authentication response was incomplete.');
            }

            this.token = result.token;
            this.currentUser = result.user;
            sessionStorage.setItem('auth_token', this.token);
            this.triggerAuthEvent('login', this.currentUser);
            this.redirectAfterLogin();
            return true;
        } catch (error) {
            this.clearSession();
            this.triggerAuthEvent('error', { message: error.message });
            return false;
        }
    }

    redirectAfterLogin() {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        if (redirect) {
            try {
                const target = new URL(redirect, window.location.origin);
                if (target.origin === window.location.origin) {
                    window.location.assign(target.href);
                    return;
                }
            } catch {
                // Invalid redirects fall back to the home page.
            }
        }

        if (window.location.pathname.endsWith('/login.html')) {
            window.location.assign('index.html');
        }
    }

    async verifyToken() {
        if (!this.token) return false;
        try {
            const result = await this.request('/auth/verify', {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.currentUser = result.user;
            this.triggerAuthEvent('verified', this.currentUser);
            return true;
        } catch {
            this.clearSession();
            this.triggerAuthEvent('logout', null);
            return false;
        }
    }

    async logout() {
        const token = this.token;
        this.clearSession();
        this.triggerAuthEvent('logout', null);
        if (!token || !this.isConfigured()) return;

        try {
            await this.request('/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            // The local session is already cleared. Avoid trapping the user.
        }
    }

    async saveProgress(courseId, topicIndex, completedTopics = [], totalTopics = 0) {
        if (!this.token) return false;
        try {
            await this.request('/user/progress', {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.token}` },
                body: JSON.stringify({
                    course_id: courseId,
                    topic_index: topicIndex,
                    completed_topics: completedTopics,
                    total_topics: totalTopics
                })
            });
            return true;
        } catch {
            return false;
        }
    }

    async getProgress() {
        if (!this.token) return {};
        try {
            const result = await this.request('/user/progress', {
                method: 'GET',
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return result.progress || {};
        } catch {
            return {};
        }
    }

    renderGoogleSignInButton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.replaceChildren();

        if (!this.isConfigured()) {
            const message = document.createElement('p');
            message.className = 'auth-status-message';
            message.textContent = 'Account sign-in is temporarily unavailable. All public lessons remain free.';
            container.appendChild(message);
            return;
        }

        if (!this.googleInitialized || !window.google?.accounts?.id) {
            const message = document.createElement('p');
            message.className = 'auth-status-message';
            message.textContent = 'Loading secure Google sign-in…';
            container.appendChild(message);
            return;
        }

        window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: Math.min(container.clientWidth || 320, 400)
        });
    }

    clearSession() {
        this.token = null;
        this.currentUser = null;
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token');
    }

    triggerAuthEvent(type, user) {
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { type, user }
        }));
    }

    isAuthenticated() {
        return Boolean(this.currentUser && this.token);
    }

    getUser() {
        return this.currentUser;
    }
}

const authService = new AuthService();
window.authService = authService;

window.addEventListener('authStateChanged', event => {
    const user = event.detail?.user;
    document.querySelectorAll('.auth-required').forEach(element => {
        element.hidden = !user;
    });
    document.querySelectorAll('.guest-only').forEach(element => {
        element.hidden = Boolean(user);
    });
    document.querySelectorAll('.google-signin-container[id]').forEach(container => {
        authService.renderGoogleSignInButton(container.id);
    });
});
