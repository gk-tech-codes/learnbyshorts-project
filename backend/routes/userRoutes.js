/**
 * User Routes - API endpoints for authentication and user management
 */

const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { authRateLimit, apiRateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const userController = new UserController();

// Public authentication routes
router.post('/auth/google', 
    authRateLimit,
    validateRequest([
        'credential'
    ]),
    userController.googleLogin
);

router.post('/auth/verify', 
    apiRateLimit,
    userController.verifyToken
);

router.post('/register', 
    authRateLimit,
    validateRequest([
        'email',
        'password',
        'first_name',
        'last_name'
    ]),
    userController.register
);

router.post('/login', 
    authRateLimit,
    validateRequest([
        'email',
        'password'
    ]),
    userController.login
);

router.post('/logout', 
    apiRateLimit,
    userController.logout
);

router.post('/password-reset/request', 
    authRateLimit,
    validateRequest([
        'email'
    ]),
    userController.requestPasswordReset
);

router.post('/password-reset/confirm', 
    authRateLimit,
    validateRequest([
        'token',
        'newPassword'
    ]),
    userController.resetPassword
);

// Protected user profile routes
router.get('/profile', 
    authenticateToken,
    apiRateLimit,
    userController.getProfile
);

router.put('/profile', 
    authenticateToken,
    apiRateLimit,
    userController.updateProfile
);

router.post('/change-password', 
    authenticateToken,
    authRateLimit,
    validateRequest([
        'currentPassword',
        'newPassword'
    ]),
    userController.changePassword
);

router.delete('/account', 
    authenticateToken,
    authRateLimit,
    validateRequest([
        'password'
    ]),
    userController.deleteAccount
);

// User progress and learning routes
router.get('/progress', 
    authenticateToken,
    apiRateLimit,
    userController.getUserProgress
);

router.get('/progress/:courseId', 
    authenticateToken,
    apiRateLimit,
    userController.getUserProgress
);

router.put('/progress/:courseId/:lessonId', 
    authenticateToken,
    apiRateLimit,
    userController.updateLessonProgress
);

router.get('/dashboard', 
    authenticateToken,
    apiRateLimit,
    userController.getDashboard
);

// Session management
router.get('/sessions', 
    authenticateToken,
    apiRateLimit,
    userController.getUserSessions
);

router.delete('/sessions/:sessionId', 
    authenticateToken,
    apiRateLimit,
    userController.revokeSession
);

module.exports = router;
