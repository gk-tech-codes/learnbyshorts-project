/**
 * Validation Middleware - Request validation and sanitization
 */

const validator = require('validator');

/**
 * Middleware to validate required fields in request body
 */
const validateRequest = (requiredFields = [], optionalFields = []) => {
    return (req, res, next) => {
        try {
            const errors = [];
            const body = req.body || {};

            // Check required fields
            for (const field of requiredFields) {
                if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
                    errors.push(`${field} is required`);
                }
            }

            // Validate field formats
            const validationRules = {
                email: (value) => {
                    if (value && !validator.isEmail(value)) {
                        return 'Invalid email format';
                    }
                    return null;
                },
                password: (value) => {
                    if (value && value.length < 8) {
                        return 'Password must be at least 8 characters long';
                    }
                    if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
                    }
                    return null;
                },
                phone: (value) => {
                    if (value && !validator.isMobilePhone(value)) {
                        return 'Invalid phone number format';
                    }
                    return null;
                },
                url: (value) => {
                    if (value && !validator.isURL(value)) {
                        return 'Invalid URL format';
                    }
                    return null;
                },
                uuid: (value) => {
                    if (value && !validator.isUUID(value)) {
                        return 'Invalid UUID format';
                    }
                    return null;
                },
                date: (value) => {
                    if (value && !validator.isISO8601(value)) {
                        return 'Invalid date format (ISO 8601 required)';
                    }
                    return null;
                },
                numeric: (value) => {
                    if (value && !validator.isNumeric(value.toString())) {
                        return 'Must be a valid number';
                    }
                    return null;
                },
                integer: (value) => {
                    if (value && !validator.isInt(value.toString())) {
                        return 'Must be a valid integer';
                    }
                    return null;
                },
                boolean: (value) => {
                    if (value !== undefined && typeof value !== 'boolean') {
                        return 'Must be a boolean value';
                    }
                    return null;
                },
                array: (value) => {
                    if (value && !Array.isArray(value)) {
                        return 'Must be an array';
                    }
                    return null;
                },
                object: (value) => {
                    if (value && (typeof value !== 'object' || Array.isArray(value))) {
                        return 'Must be an object';
                    }
                    return null;
                }
            };

            // Apply validation rules based on field names
            const allFields = [...requiredFields, ...optionalFields];
            for (const field of allFields) {
                const value = body[field];
                if (value !== undefined && value !== null && value !== '') {
                    // Check for specific field name patterns
                    if (field.includes('email') && validationRules.email(value)) {
                        errors.push(`${field}: ${validationRules.email(value)}`);
                    }
                    if (field.includes('password') && validationRules.password(value)) {
                        errors.push(`${field}: ${validationRules.password(value)}`);
                    }
                    if (field.includes('phone') && validationRules.phone(value)) {
                        errors.push(`${field}: ${validationRules.phone(value)}`);
                    }
                    if (field.includes('url') && validationRules.url(value)) {
                        errors.push(`${field}: ${validationRules.url(value)}`);
                    }
                    if (field.includes('_id') && field !== 'user_id' && validationRules.uuid(value)) {
                        errors.push(`${field}: ${validationRules.uuid(value)}`);
                    }
                    if (field.includes('date') && validationRules.date(value)) {
                        errors.push(`${field}: ${validationRules.date(value)}`);
                    }
                }
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            next();

        } catch (error) {
            console.error('Validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Validation failed'
            });
        }
    };
};

/**
 * Middleware to sanitize request data
 */
const sanitizeRequest = (req, res, next) => {
    try {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }

        next();

    } catch (error) {
        console.error('Sanitization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Request sanitization failed'
        });
    }
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeValue(key);
        sanitized[sanitizedKey] = sanitizeObject(value);
    }

    return sanitized;
};

/**
 * Sanitize a single value
 */
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        // Remove potential XSS attacks
        return validator.escape(value.trim());
    }
    return value;
};

/**
 * Middleware to validate file uploads
 */
const validateFileUpload = (options = {}) => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        required = false
    } = options;

    return (req, res, next) => {
        try {
            const file = req.file;

            if (!file && required) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload is required'
                });
            }

            if (file) {
                // Check file size
                if (file.size > maxSize) {
                    return res.status(400).json({
                        success: false,
                        message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
                    });
                }

                // Check file type
                if (!allowedTypes.includes(file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
                    });
                }

                // Sanitize filename
                if (file.originalname) {
                    file.originalname = validator.escape(file.originalname);
                }
            }

            next();

        } catch (error) {
            console.error('File validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'File validation failed'
            });
        }
    };
};

/**
 * Middleware to validate pagination parameters
 */
const validatePagination = (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        // Validate page number
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page must be a positive integer'
            });
        }

        // Validate limit
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100'
            });
        }

        // Add validated values to request
        req.pagination = {
            page: pageNum,
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
        };

        next();

    } catch (error) {
        console.error('Pagination validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Pagination validation failed'
        });
    }
};

/**
 * Middleware to validate sort parameters
 */
const validateSort = (allowedFields = []) => {
    return (req, res, next) => {
        try {
            const { sortBy, sortOrder = 'asc' } = req.query;

            if (sortBy) {
                // Validate sort field
                if (!allowedFields.includes(sortBy)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
                    });
                }

                // Validate sort order
                if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Sort order must be either "asc" or "desc"'
                    });
                }

                req.sort = {
                    field: sortBy,
                    order: sortOrder.toLowerCase()
                };
            }

            next();

        } catch (error) {
            console.error('Sort validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sort validation failed'
            });
        }
    };
};

module.exports = {
    validateRequest,
    sanitizeRequest,
    validateFileUpload,
    validatePagination,
    validateSort,
    sanitizeObject,
    sanitizeValue
};
