/**
 * LearnByShorts Authentication Service
 * Professional client-side authentication with Google OAuth
 */

class AuthService {
    constructor() {
        this.apiBaseUrl = this.getApiBaseUrl();
        this.currentUser = null;
        this.token = localStorage.getItem('auth_token');
        this.googleInitialized = false;
        
        // Initialize Google Sign-In when ready
        this.initWhenReady();
        
        // Auto-verify token on load
        if (this.token) {
            this.verifyToken();
        }
    }
    
    async initWhenReady() {
        // Wait for Google script to load
        let attempts = 0;
        while (!window.google && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.google) {
            await this.initGoogleSignIn();
        } else {
            console.error('❌ Google Sign-In script failed to load');
        }
    }
    
    getApiBaseUrl() {
        // Use AWS Lambda API Gateway endpoint with prod stage
        return 'https://x4he2xds46.execute-api.us-east-1.amazonaws.com/prod';
    }
    
    async initGoogleSignIn() {
        try {
            // Initialize Google Sign-In
            google.accounts.id.initialize({
                client_id: '1029422633354-g3po2rrk765unqn98fsirmod4muipt4l.apps.googleusercontent.com',
                callback: this.handleGoogleResponse.bind(this)
            });
            
            this.googleInitialized = true;
            console.log('✅ Google Sign-In initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Google Sign-In:', error);
        }
    }
    
    loadGoogleScript() {
        return new Promise((resolve) => {
            if (document.getElementById('google-signin-script')) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.id = 'google-signin-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    
    async handleGoogleResponse(response) {
        try {
            console.log('🔐 Google sign-in response received');
            
            const result = await this.loginWithGoogle(response.credential);
            
            if (result.success) {
                this.token = result.token;
                this.currentUser = result.user;
                
                // Store token
                localStorage.setItem('auth_token', this.token);
                
                // Trigger login event
                this.triggerAuthEvent('login', this.currentUser);
                
                console.log('✅ Login successful:', this.currentUser.name);
                return true;
            } else {
                console.error('❌ Login failed:', result.error);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            return false;
        }
    }
    
    async loginWithGoogle(googleToken) {
        try {
            console.log('🔐 Attempting Google login...');
            const response = await fetch(`${this.apiBaseUrl}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: googleToken
                })
            });
            
            console.log('📡 Google login response status:', response.status);
            const data = await response.json();
            console.log('📡 Google login response data:', data);
            
            if (response.ok) {
                return { success: true, token: data.token, user: data.user };
            } else {
                throw new Error(data.error || data.message || 'Login failed');
            }
            
        } catch (error) {
            console.error('❌ Login API error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async verifyToken() {
        if (!this.token) {
            console.log('❌ No token to verify');
            return false;
        }
        
        try {
            console.log('🔍 Verifying token...');
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.token
                })
            });
            
            console.log('📡 Verify response status:', response.status);
            const data = await response.json();
            console.log('📡 Verify response data:', data);
            
            if (response.ok && data.user) {
                this.currentUser = data.user;
                this.triggerAuthEvent('verified', this.currentUser);
                return true;
            } else {
                console.log('❌ Token verification failed:', data);
                this.logout();
                return false;
            }
            
        } catch (error) {
            console.error('❌ Token verification error:', error);
            this.logout();
            return false;
        }
    }
    
    async logout() {
        try {
            // Call logout API if token exists
            if (this.token) {
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local data
            this.token = null;
            this.currentUser = null;
            localStorage.removeItem('auth_token');
            
            // Trigger logout event
            this.triggerAuthEvent('logout', null);
            
            console.log('✅ Logged out successfully');
        }
    }
    
    async saveProgress(courseId, topicIndex, completedTopics = [], totalTopics = 0) {
        if (!this.token) {
            console.warn('⚠️ Cannot save progress: Not authenticated');
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.token,
                    course_id: courseId,
                    topic_index: topicIndex,
                    completed_topics: completedTopics,
                    total_topics: totalTopics
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Progress saved for course:', courseId);
                return true;
            } else {
                console.error('❌ Failed to save progress:', data.error);
                return false;
            }
            
        } catch (error) {
            console.error('Save progress error:', error);
            return false;
        }
    }
    
    async getProgress() {
        if (!this.token) return {};
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/progress`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.token
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return data.progress || {};
            } else {
                console.error('❌ Failed to get progress:', data.error);
                return {};
            }
            
        } catch (error) {
            console.error('Get progress error:', error);
            return {};
        }
    }
    
    renderGoogleSignInButton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Sign-in button container not found:', containerId);
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        if (this.currentUser) {
            // Show user profile
            container.innerHTML = `
                <div class="user-profile">
                    <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" class="user-avatar">
                    <span class="user-name">${this.currentUser.name}</span>
                    <button class="logout-btn" onclick="authService.logout()">Logout</button>
                </div>
            `;
        } else if (this.googleInitialized && window.google) {
            // Show sign-in button
            google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular'
            });
        } else {
            // Show loading or error
            container.innerHTML = '<p>Loading Google Sign-In...</p>';
            
            // Retry after a delay
            setTimeout(() => {
                if (this.googleInitialized) {
                    this.renderGoogleSignInButton(containerId);
                }
            }, 1000);
        }
    }
    
    triggerAuthEvent(type, user) {
        const event = new CustomEvent('authStateChanged', {
            detail: { type, user }
        });
        window.dispatchEvent(event);
    }
    
    isAuthenticated() {
        return !!this.currentUser;
    }
    
    getUser() {
        return this.currentUser;
    }
    
    getToken() {
        return this.token;
    }
}

// Global auth service instance
const authService = new AuthService();

// Listen for auth state changes
window.addEventListener('authStateChanged', (event) => {
    const { type, user } = event.detail;
    console.log(`🔐 Auth state changed: ${type}`, user);
    
    // Update UI based on auth state
    updateAuthUI(type, user);
});

function updateAuthUI(type, user) {
    // Update sign-in buttons
    const signInContainers = document.querySelectorAll('.google-signin-container');
    signInContainers.forEach(container => {
        authService.renderGoogleSignInButton(container.id);
    });
    
    // Show/hide authenticated content
    const authContent = document.querySelectorAll('.auth-required');
    const guestContent = document.querySelectorAll('.guest-only');
    
    if (user) {
        authContent.forEach(el => el.style.display = 'block');
        guestContent.forEach(el => el.style.display = 'none');
    } else {
        authContent.forEach(el => el.style.display = 'none');
        guestContent.forEach(el => el.style.display = 'block');
    }
}

// Create global instance
window.authService = new AuthService();
