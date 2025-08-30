/**
 * Mock Authentication for Development
 * Use this when Google OAuth is not configured for localhost
 */

class MockAuthService {
    constructor() {
        this.mockUser = {
            id: 'mock-user-123',
            email: 'gaurav4ever98@gmail.com',
            name: 'Gaurav Kumar',
            avatar: 'https://via.placeholder.com/40/4285f4/ffffff?text=GK'
        };
    }
    
    renderMockSignInButton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <button class="mock-signin-btn" onclick="mockAuth.mockLogin()" 
                    style="
                        background: #4285f4;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        font-size: 14px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        width: 100%;
                        justify-content: center;
                    ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                🧪 Mock Sign in with Google (Dev)
            </button>
        `;
    }
    
    mockLogin() {
        console.log('🧪 Mock login triggered');
        
        // Show loading
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.classList.remove('hidden');
        
        // Simulate API delay
        setTimeout(() => {
            // Store mock token
            localStorage.setItem('auth_token', 'mock-jwt-token-123');
            
            // Trigger auth event
            const event = new CustomEvent('authStateChanged', {
                detail: { type: 'login', user: this.mockUser }
            });
            window.dispatchEvent(event);
            
            // Hide loading
            if (loadingEl) loadingEl.classList.add('hidden');
            
            // Redirect to dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
            
            console.log('✅ Mock login successful');
        }, 1000);
    }
    
    isAuthenticated() {
        return localStorage.getItem('auth_token') === 'mock-jwt-token-123';
    }
    
    getUser() {
        return this.isAuthenticated() ? this.mockUser : null;
    }
    
    logout() {
        localStorage.removeItem('auth_token');
        const event = new CustomEvent('authStateChanged', {
            detail: { type: 'logout', user: null }
        });
        window.dispatchEvent(event);
        console.log('✅ Mock logout successful');
    }
}

// Create global mock auth instance
const mockAuth = new MockAuthService();

// Override auth service for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🧪 Development mode: Using mock authentication');
    
    // Wait for page to load, then add mock button
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            const googleContainer = document.getElementById('google-signin-btn');
            if (googleContainer) {
                // Add mock button below Google button
                const mockDiv = document.createElement('div');
                mockDiv.style.marginTop = '15px';
                mockDiv.style.paddingTop = '15px';
                mockDiv.style.borderTop = '1px solid #eee';
                mockDiv.innerHTML = `
                    <p style="text-align: center; color: #666; font-size: 12px; margin-bottom: 10px;">
                        Development Mode - OAuth not configured for localhost
                    </p>
                `;
                
                const mockContainer = document.createElement('div');
                mockContainer.id = 'mock-signin-container';
                mockDiv.appendChild(mockContainer);
                
                googleContainer.parentNode.insertBefore(mockDiv, googleContainer.nextSibling);
                mockAuth.renderMockSignInButton('mock-signin-container');
            }
        }, 2000);
    });
}
