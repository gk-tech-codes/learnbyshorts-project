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
        this.setupMobileMenu();
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
        // Find nav menu and add auth section
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        // Create auth container
        const authContainer = document.createElement('div');
        authContainer.className = 'nav-auth';
        authContainer.innerHTML = `
            <div class="auth-guest" id="auth-guest">
                <a href="login.html" class="login-btn">Sign In</a>
            </div>
            <div class="auth-user" id="auth-user" style="display: none;">
                <div class="user-menu">
                    <button class="user-btn" id="user-btn">
                        <span class="user-name" id="user-name">User</span>
                        <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        <a href="dashboard.html" class="dropdown-item">Dashboard</a>
                        <a href="#" class="dropdown-item" id="logout-btn">Sign Out</a>
                    </div>
                </div>
            </div>
        `;

        // Insert before hamburger menu
        const hamburger = document.querySelector('.hamburger');
        navMenu.parentNode.insertBefore(authContainer, hamburger);

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

    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const menuOverlay = document.querySelector('.menu-overlay');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
                if (menuOverlay) {
                    menuOverlay.classList.toggle('active');
                }
                document.body.classList.toggle('menu-open');
            });

            // Close menu when clicking overlay
            if (menuOverlay) {
                menuOverlay.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    menuOverlay.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            }
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
            // Show user menu
            guestAuth.style.display = 'none';
            userAuth.style.display = 'block';
            
            // Extract first part of email (before @)
            const displayName = this.currentUser.email.split('@')[0];
            userName.textContent = displayName;
        } else {
            // Show login button
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
        
        // Redirect to home if on protected page
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = 'index.html';
        }
    }
}

// Initialize header auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeaderAuth();
});
