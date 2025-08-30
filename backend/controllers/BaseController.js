/**
 * BaseController - Abstract base class for all controllers
 * Provides common functionality and response handling
 */

class BaseController {
    constructor() {
        this.defaultPageSize = 10;
        this.maxPageSize = 100;
    }

    /**
     * Send success response
     */
    sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Send error response
     */
    sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        // Log error for debugging (in production, use proper logging)
        if (statusCode >= 500) {
            console.error('Server Error:', message, errors);
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Send validation error response
     */
    sendValidationError(res, errors) {
        return this.sendError(res, 'Validation failed', 400, errors);
    }

    /**
     * Send not found response
     */
    sendNotFound(res, resource = 'Resource') {
        return this.sendError(res, `${resource} not found`, 404);
    }

    /**
     * Send unauthorized response
     */
    sendUnauthorized(res, message = 'Unauthorized') {
        return this.sendError(res, message, 401);
    }

    /**
     * Send forbidden response
     */
    sendForbidden(res, message = 'Forbidden') {
        return this.sendError(res, message, 403);
    }

    /**
     * Handle async route errors
     */
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Get pagination parameters from request
     */
    getPaginationParams(req) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            this.maxPageSize,
            Math.max(1, parseInt(req.query.limit) || this.defaultPageSize)
        );
        const offset = (page - 1) * limit;

        return { page, limit, offset };
    }

    /**
     * Get sort parameters from request
     */
    getSortParams(req, allowedFields = []) {
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

        if (sortBy && allowedFields.includes(sortBy)) {
            return `${sortBy} ${sortOrder}`;
        }

        return null;
    }

    /**
     * Get filter parameters from request
     */
    getFilterParams(req, allowedFilters = []) {
        const filters = {};

        for (const filter of allowedFilters) {
            if (req.query[filter] !== undefined) {
                filters[filter] = req.query[filter];
            }
        }

        return filters;
    }

    /**
     * Validate required fields
     */
    validateRequiredFields(data, requiredFields) {
        const errors = [];

        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors.push(`${field} is required`);
            }
        }

        return errors;
    }

    /**
     * Sanitize input data
     */
    sanitizeInput(data, allowedFields) {
        const sanitized = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                sanitized[field] = data[field];
            }
        }

        return sanitized;
    }

    /**
     * Extract user from request (assumes authentication middleware)
     */
    getCurrentUser(req) {
        return req.user || null;
    }

    /**
     * Check if user has required role
     */
    hasRole(user, requiredRole) {
        if (!user) return false;

        const roleHierarchy = {
            'student': 1,
            'instructor': 2,
            'admin': 3
        };

        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Check if user owns resource
     */
    isResourceOwner(user, resource) {
        if (!user || !resource) return false;
        return user.id === resource.user_id || user.id === resource.created_by;
    }

    /**
     * Format pagination response
     */
    formatPaginatedResponse(data, pagination) {
        return {
            items: data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
                hasNext: pagination.page < pagination.totalPages,
                hasPrev: pagination.page > 1
            }
        };
    }

    /**
     * Log request for debugging
     */
    logRequest(req, action = '') {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            action,
            user: req.user ? req.user.id : 'anonymous',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        console.log('Request:', JSON.stringify(logData));
    }

    /**
     * Rate limiting check (basic implementation)
     */
    checkRateLimit(req, maxRequests = 100, windowMs = 60000) {
        // In production, use Redis or similar for distributed rate limiting
        const key = `rate_limit_${req.ip}`;
        const now = Date.now();
        
        // This is a simplified implementation
        // In production, use proper rate limiting middleware
        return true;
    }

    /**
     * Validate file upload
     */
    validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const errors = [];

        if (!file) {
            errors.push('File is required');
            return errors;
        }

        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
            errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
        }

        return errors;
    }

    /**
     * Generate secure filename
     */
    generateSecureFilename(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = originalName.split('.').pop();
        
        return `${timestamp}_${random}.${extension}`;
    }

    /**
     * Clean up temporary files
     */
    cleanupTempFiles(files) {
        if (!files) return;

        const fs = require('fs');
        const filesToClean = Array.isArray(files) ? files : [files];

        filesToClean.forEach(file => {
            if (file.path) {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error cleaning up temp file:', err);
                });
            }
        });
    }

    /**
     * Format error for client
     */
    formatError(error) {
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production') {
            return {
                message: 'An error occurred',
                code: 'INTERNAL_ERROR'
            };
        }

        return {
            message: error.message,
            stack: error.stack,
            code: error.code || 'UNKNOWN_ERROR'
        };
    }

    /**
     * Validate UUID format
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Generate cache key
     */
    generateCacheKey(prefix, ...parts) {
        return `${prefix}:${parts.join(':')}`;
    }

    /**
     * Set cache headers
     */
    setCacheHeaders(res, maxAge = 300) {
        res.set({
            'Cache-Control': `public, max-age=${maxAge}`,
            'ETag': `"${Date.now()}"`,
            'Last-Modified': new Date().toUTCString()
        });
    }

    /**
     * Handle conditional requests
     */
    handleConditionalRequest(req, res, lastModified) {
        const ifModifiedSince = req.get('If-Modified-Since');
        
        if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
            return res.status(304).end();
        }

        res.set('Last-Modified', lastModified.toUTCString());
        return false;
    }
}

module.exports = BaseController;
