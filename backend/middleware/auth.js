/**
 * Authentication Middleware - JWT token validation and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const userModel = new User();

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.auth_token || 
                     req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Check if session is still valid
        const isValidSession = await userModel.isValidSession(token);
        if (!isValidSession) {
            return res.status(401).json({
                success: false,
                message: 'Session has expired or been invalidated'
            });
        }

        // Get user details
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user account is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check if account is locked
        if (user.is_locked && new Date(user.locked_until) > new Date()) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked'
            });
        }

        // Attach user to request object
        req.user = user;
        req.token = token;
        
        next();

    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Middleware to check user roles
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Define role hierarchy
            const roleHierarchy = {
                'student': 1,
                'instructor': 2,
                'admin': 3
            };

            const userRoleLevel = roleHierarchy[user.role] || 0;
            const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    success: false,
                    message: `${requiredRole} access required`
                });
            }

            next();

        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};

/**
 * Middleware to check specific permissions
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Parse user permissions from metadata
            const userMetadata = user.metadata ? JSON.parse(user.metadata) : {};
            const userPermissions = userMetadata.permissions || [];

            // Admin has all permissions
            if (user.role === 'admin') {
                return next();
            }

            // Check if user has the required permission
            if (!userPermissions.includes(permission)) {
                return res.status(403).json({
                    success: false,
                    message: `Permission '${permission}' required`
                });
            }

            next();

        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.auth_token || 
                     req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await userModel.findById(decoded.id);
        
        if (user && user.is_active) {
            req.user = user;
            req.token = token;
        }

        next();

    } catch (error) {
        // Silently continue without authentication
        next();
    }
};

/**
 * Middleware to check if user owns the resource
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'user_id') => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const resourceId = req.params[resourceIdParam];

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Admin can access any resource
            if (user.role === 'admin') {
                return next();
            }

            // For other users, check ownership
            // This would typically involve checking the resource in the database
            // For now, we'll pass the check to the controller to handle
            req.requireOwnershipCheck = {
                userId: user.id,
                resourceId,
                userIdField
            };

            next();

        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Ownership check failed'
            });
        }
    };
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = (eventType) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            const ip = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            console.log(`Auth Event: ${eventType}`, {
                userId: user?.id,
                email: user?.email,
                ip,
                userAgent,
                timestamp: new Date().toISOString()
            });

            next();

        } catch (error) {
            console.error('Auth logging error:', error);
            next(); // Continue even if logging fails
        }
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    optionalAuth,
    requireOwnership,
    logAuthEvent
};
