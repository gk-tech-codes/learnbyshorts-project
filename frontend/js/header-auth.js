/**
 * Header authentication display.
 * Trust only the verified state emitted by AuthService.
 */
class HeaderAuth {
    constructor() {
        this.currentUser = null;
        this.createAuthElements();
        window.addEventListener('authStateChanged', event => {
            this.currentUser = event.detail?.user || null;
            this.updateAuthDisplay();
        });
    }

    createAuthElements() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu || document.getElementById('auth-guest')) return;

        this.guestLink = document.createElement('a');
        this.guestLink.href = 'login.html';
        this.guestLink.className = 'nav-link login-btn';
        this.guestLink.id = 'auth-guest';
        this.guestLink.textContent = 'Login';

        this.userMenu = document.createElement('div');
        this.userMenu.className = 'user-menu';
        this.userMenu.id = 'auth-user';
        this.userMenu.hidden = true;

        const button = document.createElement('button');
        button.className = 'user-btn';
        button.type = 'button';
        button.setAttribute('aria-expanded', 'false');
        this.userName = document.createElement('span');
        this.userName.className = 'user-name';
        this.userName.textContent = 'Learner';
        button.append(this.userName);

        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        const logout = document.createElement('button');
        logout.className = 'dropdown-item';
        logout.type = 'button';
        logout.textContent = 'Sign Out';
        dropdown.append(logout);
        this.userMenu.append(button, dropdown);
        navMenu.append(this.guestLink, this.userMenu);

        button.addEventListener('click', event => {
            event.stopPropagation();
            const open = dropdown.classList.toggle('show');
            button.setAttribute('aria-expanded', String(open));
        });
        logout.addEventListener('click', () => window.authService?.logout());
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
            button.setAttribute('aria-expanded', 'false');
        });
    }

    updateAuthDisplay() {
        if (!this.guestLink || !this.userMenu) return;
        const authenticated = Boolean(this.currentUser);
        this.guestLink.hidden = authenticated;
        this.userMenu.hidden = !authenticated;
        if (authenticated) {
            this.userName.textContent =
                this.currentUser.name?.split(/\s+/)[0] ||
                this.currentUser.email?.split('@')[0] ||
                'Learner';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new HeaderAuth());
