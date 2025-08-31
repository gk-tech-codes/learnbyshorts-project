// Rate Limiting & Abuse Prevention System
class RateLimiter {
    constructor() {
        this.limits = {
            pageViews: { max: 100, window: 60000 }, // 100 requests per minute
            formSubmissions: { max: 5, window: 300000 }, // 5 submissions per 5 minutes
            apiCalls: { max: 50, window: 60000 }, // 50 API calls per minute
            downloads: { max: 10, window: 300000 } // 10 downloads per 5 minutes
        };
        
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupFormProtection();
        this.setupAPIProtection();
        this.cleanupOldEntries();
    }

    // Get client fingerprint for tracking
    getClientFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Rate limiting fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return 'fp_' + Math.abs(hash).toString(36);
    }

    // Check if action is rate limited
    isRateLimited(action, identifier = null) {
        const key = identifier || this.getClientFingerprint();
        const storageKey = `rl_${action}_${key}`;
        const limit = this.limits[action];
        
        if (!limit) return false;
        
        const now = Date.now();
        const requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Remove old requests outside the time window
        const validRequests = requests.filter(timestamp => 
            now - timestamp < limit.window
        );
        
        // Check if limit exceeded
        if (validRequests.length >= limit.max) {
            console.warn(`🚫 Rate limit exceeded for ${action}:`, {
                current: validRequests.length,
                max: limit.max,
                windowMs: limit.window
            });
            return true;
        }
        
        // Add current request
        validRequests.push(now);
        localStorage.setItem(storageKey, JSON.stringify(validRequests));
        
        return false;
    }

    // Track page views for abuse detection
    trackPageView() {
        if (this.isRateLimited('pageViews')) {
            this.showRateLimitWarning('Too many page requests. Please slow down.');
            return;
        }
        
        // Log legitimate page view
        console.log('📊 Page view tracked');
    }

    // Protect all forms from spam
    setupFormProtection() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                if (this.isRateLimited('formSubmissions')) {
                    e.preventDefault();
                    this.showRateLimitWarning('Too many form submissions. Please wait 5 minutes before trying again.');
                    return false;
                }
            }
        });
    }

    // Protect API calls and AJAX requests
    setupAPIProtection() {
        // Override fetch to add rate limiting
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const url = args[0];
            
            // Check if it's an API call (contains 'api' or loads data files)
            if (typeof url === 'string' && 
                (url.includes('/data/') || url.includes('/api/') || url.includes('.json'))) {
                
                if (this.isRateLimited('apiCalls')) {
                    console.warn('🚫 API rate limit exceeded');
                    return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
                }
            }
            
            return originalFetch.apply(this, args);
        };

        // Override XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (typeof url === 'string' && 
                (url.includes('/data/') || url.includes('/api/') || url.includes('.json'))) {
                
                const rateLimiter = window.rateLimiter || new RateLimiter();
                if (rateLimiter.isRateLimited('apiCalls')) {
                    console.warn('🚫 XMLHttpRequest rate limit exceeded');
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
            }
            
            return originalOpen.apply(this, [method, url, ...args]);
        };
    }

    // Show rate limit warning to user
    showRateLimitWarning(message) {
        // Remove existing warning
        const existingWarning = document.getElementById('rate-limit-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // Create warning banner
        const warning = document.createElement('div');
        warning.id = 'rate-limit-warning';
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #dc3545;
                color: white;
                padding: 15px;
                text-align: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">
                <strong>⚠️ Rate Limit Exceeded</strong><br>
                ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 5px 10px;
                    margin-left: 15px;
                    border-radius: 3px;
                    cursor: pointer;
                ">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }

    // Clean up old localStorage entries
    cleanupOldEntries() {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        
        keys.forEach(key => {
            if (key.startsWith('rl_')) {
                try {
                    const requests = JSON.parse(localStorage.getItem(key) || '[]');
                    const validRequests = requests.filter(timestamp => 
                        now - timestamp < 3600000 // Keep entries for 1 hour max
                    );
                    
                    if (validRequests.length === 0) {
                        localStorage.removeItem(key);
                    } else if (validRequests.length !== requests.length) {
                        localStorage.setItem(key, JSON.stringify(validRequests));
                    }
                } catch (e) {
                    // Remove corrupted entries
                    localStorage.removeItem(key);
                }
            }
        });
    }

    // Get current rate limit status
    getRateLimitStatus() {
        const key = this.getClientFingerprint();
        const status = {};
        
        Object.keys(this.limits).forEach(action => {
            const storageKey = `rl_${action}_${key}`;
            const requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const now = Date.now();
            const limit = this.limits[action];
            
            const validRequests = requests.filter(timestamp => 
                now - timestamp < limit.window
            );
            
            status[action] = {
                current: validRequests.length,
                max: limit.max,
                remaining: Math.max(0, limit.max - validRequests.length),
                resetTime: validRequests.length > 0 ? 
                    new Date(Math.min(...validRequests) + limit.window) : null
            };
        });
        
        return status;
    }

    // Reset rate limits (for testing)
    resetRateLimits() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('rl_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🔄 Rate limits reset');
    }
}

// Initialize rate limiter
window.rateLimiter = new RateLimiter();

// Expose for debugging
window.getRateLimitStatus = () => window.rateLimiter.getRateLimitStatus();
window.resetRateLimits = () => window.rateLimiter.resetRateLimits();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimiter;
}
