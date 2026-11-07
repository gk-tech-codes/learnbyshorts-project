(function () {
    'use strict';

    const mode = document.body.dataset.authMode;
    const action = document.querySelector('[data-auth-action]');
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

        action?.addEventListener('click', async () => {
            action.disabled = true;
            showStatus('Opening the secure authentication page…');
            try {
                await window.authService.signIn(mode === 'signup' ? 'signup' : 'login');
            } catch {
                action.disabled = false;
                showStatus('Sign-in could not start safely. Please try again.', true);
            }
        });
    }

    initialize();
})();
