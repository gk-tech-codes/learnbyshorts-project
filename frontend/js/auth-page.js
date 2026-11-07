(function () {
    'use strict';

    const mode = document.body.dataset.authMode;
    const action = document.querySelector('[data-auth-action]');
    const providerActions = [...document.querySelectorAll('[data-auth-provider]')];
    const providerDivider = document.querySelector('[data-provider-divider]');
    const providerNote = document.querySelector('[data-provider-note]');
    const status = document.querySelector('[data-auth-status]');
    const retry = document.querySelector('[data-auth-retry]');

    function showStatus(message, isError = false) {
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    function safeRedirect() {
        const requested = new URLSearchParams(window.location.search).get('redirect');
        try {
            const target = new URL(requested || '/dashboard.html', window.location.origin);
            if (target.origin !== window.location.origin) return '/dashboard.html';
            return `${target.pathname}${target.search}${target.hash}`;
        } catch {
            return '/dashboard.html';
        }
    }

    async function initialize() {
        await window.authService?.initialized;

        if (mode === 'callback') {
            try {
                await window.authService.completeSignIn();
            } catch (error) {
                document.querySelector('.callback-spinner')?.remove();
                showStatus(
                    error instanceof Error
                        ? error.message
                        : 'The secure sign-in session could not be completed.',
                    true
                );
                if (retry) retry.hidden = false;
            }
            return;
        }

        if (!window.authService?.isConfigured()) {
            if (action) action.disabled = true;
            providerActions.forEach(button => {
                button.disabled = true;
            });
            showStatus(
                'Secure account sign-in is temporarily unavailable. Public lessons still work without an account.',
                true
            );
            return;
        }

        if (window.authService.isAuthenticated()) {
            window.location.replace(safeRedirect());
            return;
        }

        const availableProviders = providerActions.filter(button => {
            const available = window.authService.hasIdentityProvider(button.dataset.authProvider);
            button.hidden = !available;
            return available;
        });
        if (providerDivider) providerDivider.hidden = availableProviders.length === 0;
        if (providerNote) {
            providerNote.textContent = availableProviders.length > 0
                ? 'Choose Google for one-click access or continue with Cognito email and password.'
                : 'Email/password sign-in is active. Gmail addresses work, but Google single sign-on is not enabled yet.';
        }

        async function startSignIn(button, provider = '') {
            const buttons = [action, ...availableProviders].filter(Boolean);
            buttons.forEach(candidate => {
                candidate.disabled = true;
            });
            showStatus('Opening the secure authentication page…');
            try {
                if (provider) {
                    await window.authService.signInWithProvider(
                        provider,
                        mode === 'signup' ? 'signup' : 'login'
                    );
                } else {
                    await window.authService.signIn(mode === 'signup' ? 'signup' : 'login');
                }
            } catch {
                buttons.forEach(candidate => {
                    candidate.disabled = false;
                });
                showStatus('Sign-in could not start safely. Please try again.', true);
            }
        }

        action?.addEventListener('click', () => startSignIn(action));
        availableProviders.forEach(button => {
            button.addEventListener('click', () => {
                startSignIn(button, button.dataset.authProvider);
            });
        });
    }

    initialize();
})();
