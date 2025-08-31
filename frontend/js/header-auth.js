/**
 * Header Authentication Management
 * Handles login state, user display, and mobile menu
 */

class HeaderAuth {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('auth_token');
        this.init();
    }

    init() {
        this.createAuthElements();
        this.checkAuthState();
        
        // Listen for auth state changes
        window.addEventListener('authStateChanged', (event) => {
            const { type, user } = event.detail;
            if (type === 'login') {
                this.currentUser = user;
                this.updateAuthDisplay();
            } else if (type === 'logout') {
                this.currentUser = null;
                this.updateAuthDisplay();
            }
        });
    }

    createAuthElements() {
        // Find nav menu and add auth link
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        // Create auth elements
        const authGuest = document.createElement('a');
        authGuest.href = 'login.html';
        authGuest.className = 'nav-link login-btn';
        authGuest.id = 'auth-guest';
        authGuest.textContent = 'Login';

        const authUser = document.createElement('div');
        authUser.className = 'user-menu';
        authUser.id = 'auth-user';
        authUser.style.display = 'none';
        authUser.innerHTML = `
            <button class="user-btn" id="user-btn">
                <span class="user-name" id="user-name">User</span>
                <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                </svg>
            </button>
            <div class="user-dropdown" id="user-dropdown">
                <a href="#" class="dropdown-item" id="logout-btn">Sign Out</a>
            </div>
        `;

        // Add to nav menu
        navMenu.appendChild(authGuest);
        navMenu.appendChild(authUser);

        // Setup event listeners
        this.setupAuthEvents();
    }

    setupAuthEvents() {
        // User menu toggle
        const userBtn = document.getElementById('user-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userBtn && userDropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    checkAuthState() {
        if (this.token) {
            // Try to get user info from token or make API call
            try {
                // For now, simulate user from token
                const mockUser = {
                    email: 'gaurav4ever98@gmail.com',
                    name: 'Gaurav Kumar'
                };
                this.currentUser = mockUser;
                this.updateAuthDisplay();
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
            }
        }
    }

    updateAuthDisplay() {
        const guestAuth = document.getElementById('auth-guest');
        const userAuth = document.getElementById('auth-user');
        const userName = document.getElementById('user-name');

        if (!guestAuth || !userAuth || !userName) return;

        if (this.currentUser) {
            // Show user menu, hide login link
            guestAuth.style.display = 'none';
            userAuth.style.display = 'block';
            
            // Extract first part of email (before @)
            const displayName = this.currentUser.email.split('@')[0];
            userName.textContent = displayName;
        } else {
            // Show login link, hide user menu
            guestAuth.style.display = 'block';
            userAuth.style.display = 'none';
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        this.currentUser = null;
        this.token = null;
        this.updateAuthDisplay();
        
        // Trigger logout event
        const event = new CustomEvent('authStateChanged', {
            detail: { type: 'logout', user: null }
        });
        window.dispatchEvent(event);
    }
}

// Initialize header auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeaderAuth();
});
