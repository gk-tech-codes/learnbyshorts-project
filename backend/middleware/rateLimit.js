/**
 * Rate Limiting Middleware - Protect API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * Create a rate limiter with custom options
 */
const createRateLimit = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res) => {
            res.status(429).json(options.message || defaultOptions.message);
        },
        skip: (req) => {
            // Skip rate limiting for certain conditions
            const skipConditions = options.skip || [];
            return skipConditions.some(condition => condition(req));
        },
        keyGenerator: (req) => {
            // Use custom key generator if provided
            if (options.keyGenerator) {
                return options.keyGenerator(req);
            }
            // Default: use IP address
            return req.ip;
        }
    };

    return rateLimit({
        ...defaultOptions,
        ...options
    });
};

/**
 * Authentication rate limiter - stricter limits for auth endpoints
 */
const authRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * API rate limiter - general API endpoints
 */
const apiRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many API requests, please try again later'
    }
});

/**
 * Upload rate limiter - for file upload endpoints
 */
const uploadRateLimit = createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads, please try again later'
    }
});

/**
 * Search rate limiter - for search endpoints
 */
const searchRateLimit = createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 searches per minute
    message: {
        success: false,
        message: 'Too many search requests, please slow down'
    }
});

/**
 * Password reset rate limiter
 */
const passwordResetRateLimit = createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later'
    },
    keyGenerator: (req) => {
        // Use email if provided, otherwise fall back to IP
        return req.body?.email || req.ip;
    }
});

/**
 * Speed limiter - slow down requests instead of blocking
 */
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs without delay
    delayMs: () => 500, // add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // maximum delay of 20 seconds
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip
});

/**
 * User-specific rate limiter - limits based on authenticated user
 */
const userRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // authenticated users get higher limits
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    },
    skip: (req) => {
        // Skip for admin users
        return req.user?.role === 'admin';
    }
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicRateLimit = (req, res, next) => {
    const user = req.user;
    
    let limiter;
    if (!user) {
        // Anonymous users - strict limits
        limiter = createRateLimit({
            windowMs: 15 * 60 * 1000,
            max: 50,
            message: {
                success: false,
                message: 'Too many requests. Please login for higher limits.'
            }
        });
    } else if (user.role === 'admin') {
        // Admin users - no limits
        return next();
    } else if (user.role === 'instructor') {
        // Instructor users - high limits
        limiter = createRateLimit({
            windowMs: 15 * 60 * 1000,
            max: 500,
            keyGenerator: () => user.id
        });
    } else {
        // Regular users - moderate limits
        limiter = createRateLimit({
            windowMs: 15 * 60 * 1000,
            max: 200,
            keyGenerator: () => user.id
        });
    }

    limiter(req, res, next);
};

/**
 * Create endpoint-specific rate limiter
 */
const createEndpointRateLimit = (endpoint, options = {}) => {
    const endpointLimits = {
        'login': { windowMs: 15 * 60 * 1000, max: 5 },
        'register': { windowMs: 60 * 60 * 1000, max: 3 },
        'password-reset': { windowMs: 60 * 60 * 1000, max: 3 },
        'upload': { windowMs: 60 * 60 * 1000, max: 10 },
        'search': { windowMs: 1 * 60 * 1000, max: 30 },
        'api': { windowMs: 15 * 60 * 1000, max: 100 }
    };

    const defaultLimits = endpointLimits[endpoint] || endpointLimits['api'];
    
    return createRateLimit({
        ...defaultLimits,
        ...options,
        message: {
            success: false,
            message: options.message || `Too many ${endpoint} requests, please try again later`
        }
    });
};

/**
 * Bypass rate limiting for certain conditions
 */
const bypassRateLimit = (conditions = []) => {
    return (req, res, next) => {
        // Check if any bypass condition is met
        const shouldBypass = conditions.some(condition => {
            if (typeof condition === 'function') {
                return condition(req);
            }
            return false;
        });

        if (shouldBypass) {
            return next();
        }

        // Apply default rate limiting
        apiRateLimit(req, res, next);
    };
};

/**
 * Rate limit store cleanup (for production use with Redis)
 */
const cleanupRateLimitStore = () => {
    // This would typically clean up expired entries in Redis
    // For memory store, this is handled automatically
    console.log('Rate limit store cleanup completed');
};

module.exports = {
    rateLimit: createRateLimit,
    authRateLimit,
    apiRateLimit,
    uploadRateLimit,
    searchRateLimit,
    passwordResetRateLimit,
    speedLimiter,
    userRateLimit,
    dynamicRateLimit,
    createEndpointRateLimit,
    bypassRateLimit,
    cleanupRateLimitStore
};
