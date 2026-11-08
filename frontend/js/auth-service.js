/**
 * Cognito Authorization Code + PKCE client.
 *
 * Only the short-lived access token stays in sessionStorage. ID and refresh
 * tokens are never persisted. API Gateway independently verifies the access
 * token before Lambda.
 */
class AuthService {
    constructor() {
        this.config = window.LearnByShortsAuthConfig || {};
        this.keys = {
            access: 'lbs:auth:access',
            verifier: 'lbs:auth:verifier',
            state: 'lbs:auth:state',
            nonce: 'lbs:auth:nonce',
            returnTo: 'lbs:auth:return-to'
        };
        this.currentUser = null;
        this.initialized = this.init();
    }

    isConfigured() {
        try {
            const domain = new URL(this.config.domain);
            const api = new URL(this.config.apiBaseUrl);
            const callback = new URL(this.config.redirectUri);
            const logout = new URL(this.config.logoutUri);
            return domain.protocol === 'https:' &&
                api.protocol === 'https:' &&
                callback.origin === window.location.origin &&
                logout.origin === window.location.origin &&
                /^[A-Za-z0-9]+$/.test(this.config.clientId || '') &&
                /^us-[a-z]+-\d+_[A-Za-z0-9]+$/.test(this.config.userPoolId || '');
        } catch {
            return false;
        }
    }

    async init() {
        if (!this.isConfigured()) {
            this.clearSession();
            this.emit('unavailable');
            return;
        }
        if (!this.read(this.keys.access)) {
            this.emit('ready');
            return;
        }
        try {
            await this.ensureAccessToken();
            await this.loadProfile();
            this.emit('verified');
        } catch {
            this.clearSession();
            this.emit('ready');
        }
    }

    read(key) {
        try {
            return sessionStorage.getItem(key) || '';
        } catch {
            return '';
        }
    }

    write(key, value) {
        try {
            if (value) sessionStorage.setItem(key, value);
        } catch {
            // Public lessons continue to work when browser storage is blocked.
        }
    }

    base64Url(bytes) {
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    }

    randomValue(length = 32) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return this.base64Url(bytes);
    }

    async pkceChallenge(verifier) {
        const digest = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(verifier)
        );
        return this.base64Url(new Uint8Array(digest));
    }

    decodeJwt(token) {
        try {
            const value = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(value.padEnd(Math.ceil(value.length / 4) * 4, '=')));
        } catch {
            return null;
        }
    }

    tokenIsCurrent(token, minimumSeconds = 30) {
        const claims = this.decodeJwt(token);
        return Boolean(
            claims?.exp &&
            claims.exp > Math.floor(Date.now() / 1000) + minimumSeconds
        );
    }

    validateIdToken(token, expectedNonce = '') {
        const claims = this.decodeJwt(token);
        const issuer =
            `https://cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`;
        if (!claims ||
            claims.iss !== issuer ||
            claims.aud !== this.config.clientId ||
            claims.token_use !== 'id' ||
            !this.tokenIsCurrent(token, 0) ||
            (expectedNonce && claims.nonce !== expectedNonce)) {
            throw new Error('The identity response could not be validated.');
        }
        return claims;
    }

    safeReturnPath(candidate) {
        try {
            const target = new URL(candidate || '/', window.location.origin);
            if (target.origin !== window.location.origin) return '/';
            if (target.pathname.endsWith('/auth/callback.html')) return '/dashboard.html';
            return `${target.pathname}${target.search}${target.hash}`;
        } catch {
            return '/';
        }
    }

    async signIn(mode = 'login') {
        if (!this.isConfigured()) {
            throw new Error('Account sign-in is temporarily unavailable.');
        }

        const verifier = this.randomValue(64);
        const state = this.randomValue();
        const nonce = this.randomValue();
        const requestedReturn = new URLSearchParams(window.location.search).get('redirect');
        this.write(this.keys.verifier, verifier);
        this.write(this.keys.state, state);
        this.write(this.keys.nonce, nonce);
        this.write(
            this.keys.returnTo,
            this.safeReturnPath(requestedReturn || '/dashboard.html')
        );

        const authorize = new URL('/oauth2/authorize', this.config.domain);
        authorize.search = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            state,
            nonce,
            code_challenge: await this.pkceChallenge(verifier),
            code_challenge_method: 'S256',
            ...(mode === 'signup' ? { screen_hint: 'signup' } : {})
        }).toString();
        window.location.assign(authorize.href);
    }

    async signInWithProvider(provider, mode = 'login') {
        const providerName = String(provider || '');
        if (!this.hasIdentityProvider(providerName) || providerName === 'COGNITO') {
            throw new Error('That identity provider is not available.');
        }

        if (!this.isConfigured()) {
            throw new Error('Account sign-in is temporarily unavailable.');
        }

        const verifier = this.randomValue(64);
        const state = this.randomValue();
        const nonce = this.randomValue();
        const requestedReturn = new URLSearchParams(window.location.search).get('redirect');
        this.write(this.keys.verifier, verifier);
        this.write(this.keys.state, state);
        this.write(this.keys.nonce, nonce);
        this.write(
            this.keys.returnTo,
            this.safeReturnPath(requestedReturn || '/dashboard.html')
        );

        const authorize = new URL('/oauth2/authorize', this.config.domain);
        authorize.search = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            state,
            nonce,
            code_challenge: await this.pkceChallenge(verifier),
            code_challenge_method: 'S256',
            identity_provider: providerName,
            ...(mode === 'signup' ? { screen_hint: 'signup' } : {})
        }).toString();
        window.location.assign(authorize.href);
    }

    async exchangeToken(parameters) {
        const response = await fetch(new URL('/oauth2/token', this.config.domain), {
            method: 'POST',
            credentials: 'omit',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(parameters)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.access_token) {
            throw new Error('The secure sign-in session could not be completed.');
        }
        return data;
    }

    storeTokens(tokens) {
        this.write(this.keys.access, tokens.access_token);
    }

    clearLoginState() {
        try {
            [this.keys.verifier, this.keys.state, this.keys.nonce]
                .forEach(key => sessionStorage.removeItem(key));
        } catch {
            // Ignore restricted storage.
        }
    }

    async completeSignIn() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
            throw new Error('Sign-in was cancelled or could not be completed.');
        }

        const code = params.get('code');
        const returnedState = params.get('state');
        const expectedState = this.read(this.keys.state);
        const verifier = this.read(this.keys.verifier);
        const nonce = this.read(this.keys.nonce);
        if (!code || !returnedState || returnedState !== expectedState || !verifier) {
            throw new Error('The sign-in response did not match this browser session.');
        }

        const tokens = await this.exchangeToken({
            grant_type: 'authorization_code',
            client_id: this.config.clientId,
            code,
            redirect_uri: this.config.redirectUri,
            code_verifier: verifier
        });
        this.validateIdToken(tokens.id_token, nonce);
        this.storeTokens(tokens);
        this.clearLoginState();
        await this.loadProfile();
        this.emit('login');

        const destination = this.safeReturnPath(this.read(this.keys.returnTo));
        try {
            sessionStorage.removeItem(this.keys.returnTo);
        } catch {
            // Ignore restricted storage.
        }
        window.location.replace(destination || '/dashboard.html');
    }

    async ensureAccessToken() {
        const accessToken = this.read(this.keys.access);
        if (this.tokenIsCurrent(accessToken)) return accessToken;
        this.clearSession();
        throw new Error('Your secure session expired. Please sign in again.');
    }

    async apiRequest(path, options = {}) {
        const accessToken = await this.ensureAccessToken();
        const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
            ...options,
            credentials: 'omit',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                ...(options.headers || {})
            }
        });
        if (response.status === 401) {
            this.clearSession();
            this.emit('ready');
            throw new Error('Your secure session expired. Please sign in again.');
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The account request failed.');
        return data;
    }

    async loadProfile() {
        const profile = await this.apiRequest('/v1/me');
        this.currentUser = {
            id: profile.userId || '',
            email: profile.email || '',
            name: profile.name || profile.email || 'Learner',
            avatar: profile.avatar || ''
        };
        return this.currentUser;
    }

    async getProgress() {
        return this.apiRequest('/v1/progress');
    }

    async getCourseProgress(courseId) {
        return this.apiRequest(`/v1/progress/${encodeURIComponent(courseId)}`);
    }

    async saveProgress(courseId, state) {
        if (!this.isAuthenticated()) return false;
        try {
            await this.apiRequest(`/v1/progress/${encodeURIComponent(courseId)}`, {
                method: 'PUT',
                body: JSON.stringify(state)
            });
            return true;
        } catch {
            return false;
        }
    }

    async syncLocalProgress() {
        const courses = {};
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key?.startsWith('lbs2:')) continue;
            try {
                courses[key.slice(5)] = JSON.parse(localStorage.getItem(key));
            } catch {
                // Ignore malformed local progress.
            }
        }
        return this.apiRequest('/v1/sync', {
            method: 'POST',
            body: JSON.stringify({ courses })
        });
    }

    async logout() {
        this.clearSession();
        this.emit('logout');
        const logout = new URL('/logout', this.config.domain);
        logout.search = new URLSearchParams({
            client_id: this.config.clientId,
            logout_uri: this.config.logoutUri
        }).toString();
        window.location.assign(logout.href);
    }

    clearSession() {
        this.currentUser = null;
        try {
            Object.values(this.keys).forEach(key => sessionStorage.removeItem(key));
            localStorage.removeItem('auth_token');
        } catch {
            // Ignore restricted storage.
        }
    }

    emit(type) {
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { type, user: this.currentUser }
        }));
    }

    isAuthenticated() {
        return Boolean(
            this.currentUser &&
            this.tokenIsCurrent(this.read(this.keys.access), 0)
        );
    }

    hasIdentityProvider(provider) {
        return Array.isArray(this.config.identityProviders) &&
            this.config.identityProviders.includes(provider);
    }

    getUser() {
        return this.currentUser;
    }
}

window.authService = new AuthService();
