/**
 * UserController - Handles user authentication, profile management, and progress tracking
 */

const BaseController = require('./BaseController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

class UserController extends BaseController {
    constructor() {
        super();
        this.userModel = new User();
        this.awsApiUrl = 'https://x4he2xds46.execute-api.us-east-1.amazonaws.com';
    }

    /**
     * Google OAuth login
     */
    googleLogin = this.asyncHandler(async (req, res) => {
        try {
            const { credential } = req.body;

            if (!credential) {
                return this.sendError(res, 'Google credential is required', 400);
            }

            // Call AWS Lambda for Google authentication
            const response = await axios.post(`${this.awsApiUrl}/auth/google`, {
                credential
            });

            const { user, token } = response.data;

            // Set secure cookie
            this.setAuthCookie(res, token);

            this.logRequest(req, 'GOOGLE_LOGIN');
            return this.sendSuccess(res, {
                user,
                token
            }, 'Google login successful');

        } catch (error) {
            console.error('Error with Google login:', error);
            if (error.response?.status === 401) {
                return this.sendError(res, 'Invalid Google credential', 401);
            }
            return this.sendError(res, 'Failed to authenticate with Google');
        }
    });

    /**
     * Verify JWT token
     */
    verifyToken = this.asyncHandler(async (req, res) => {
        try {
            const token = this.getTokenFromRequest(req);

            if (!token) {
                return this.sendError(res, 'No token provided', 401);
            }

            // Call AWS Lambda for token verification
            const response = await axios.post(`${this.awsApiUrl}/auth/verify`, {
                token
            });

            const { user } = response.data;

            return this.sendSuccess(res, { user }, 'Token verified successfully');

        } catch (error) {
            console.error('Error verifying token:', error);
            if (error.response?.status === 401) {
                return this.sendError(res, 'Invalid or expired token', 401);
            }
            return this.sendError(res, 'Failed to verify token');
        }
    });

    /**
     * User registration
     */
    register = this.asyncHandler(async (req, res) => {
        try {
            const allowedFields = [
                'email', 'password', 'first_name', 'last_name', 
                'phone', 'date_of_birth', 'preferences'
            ];

            const userData = this.sanitizeInput(req.body, allowedFields);
            
            // Validate required fields
            const requiredFields = ['email', 'password', 'first_name', 'last_name'];
            const validationErrors = this.validateRequiredFields(userData, requiredFields);
            if (validationErrors.length > 0) {
                return this.sendValidationError(res, validationErrors);
            }

            // Validate email format
            if (!this.isValidEmail(userData.email)) {
                return this.sendError(res, 'Invalid email format', 400);
            }

            // Check if user already exists
            const existingUser = await this.userModel.findByEmail(userData.email);
            if (existingUser) {
                return this.sendError(res, 'User with this email already exists', 409);
            }

            // Validate password strength
            const passwordValidation = this.userModel.validatePassword(userData.password);
            if (!passwordValidation.isValid) {
                return this.sendError(res, passwordValidation.message, 400);
            }

            // Create user
            const user = await this.userModel.createUser(userData);

            // Generate JWT token
            const token = this.generateToken(user);

            // Set secure cookie
            this.setAuthCookie(res, token);

            // Remove sensitive data from response
            const { password_hash, ...userResponse } = user;

            this.logRequest(req, 'USER_REGISTER');
            return this.sendSuccess(res, {
                user: userResponse,
                token
            }, 'User registered successfully', 201);

        } catch (error) {
            console.error('Error registering user:', error);
            if (error.message.includes('UNIQUE constraint failed')) {
                return this.sendError(res, 'Email already registered', 409);
            }
            return this.sendError(res, 'Failed to register user');
        }
    });

    /**
     * User login
     */
    login = this.asyncHandler(async (req, res) => {
        try {
            const { email, password, rememberMe = false } = req.body;

            if (!email || !password) {
                return this.sendError(res, 'Email and password are required', 400);
            }

            if (!this.isValidEmail(email)) {
                return this.sendError(res, 'Invalid email format', 400);
            }

            // Check rate limiting
            const attempts = await this.userModel.getLoginAttempts(email);
            
            if (attempts >= 5) {
                return this.sendError(res, 'Too many login attempts. Please try again later', 429);
            }

            // Find user by email
            const user = await this.userModel.findByEmail(email);
            if (!user) {
                await this.userModel.recordLoginAttempt(email);
                return this.sendError(res, 'Invalid email or password', 401);
            }

            // Check if account is locked
            if (user.is_locked && new Date(user.locked_until) > new Date()) {
                return this.sendError(res, 'Account is temporarily locked', 423);
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                await this.userModel.recordLoginAttempt(email);
                await this.userModel.incrementFailedAttempts(user.id);
                return this.sendError(res, 'Invalid email or password', 401);
            }

            // Check if account is active
            if (!user.is_active) {
                return this.sendError(res, 'Account is deactivated', 403);
            }

            // Reset failed attempts on successful login
            await this.userModel.resetFailedAttempts(user.id);
            await this.userModel.clearLoginAttempts(email);

            // Update last login
            await this.userModel.updateLastLogin(user.id);

            // Generate JWT token
            const tokenExpiry = rememberMe ? '30d' : '24h';
            const token = this.generateToken(user, tokenExpiry);

            // Set secure cookie
            this.setAuthCookie(res, token, rememberMe);

            // Create session
            await this.userModel.createSession(user.id, token, req.ip, req.get('User-Agent'));

            // Remove sensitive data from response
            const { password_hash, ...userResponse } = user;

            this.logRequest(req, 'USER_LOGIN');
            return this.sendSuccess(res, {
                user: userResponse,
                token
            }, 'Login successful');

        } catch (error) {
            console.error('Error logging in user:', error);
            return this.sendError(res, 'Failed to login');
        }
    });

    /**
     * User logout
     */
    logout = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const token = this.getTokenFromRequest(req);

            if (token) {
                // Invalidate session
                await this.userModel.invalidateSession(token);
            }

            // Clear auth cookie
            res.clearCookie('auth_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            this.logRequest(req, 'USER_LOGOUT');
            return this.sendSuccess(res, null, 'Logout successful');

        } catch (error) {
            console.error('Error logging out user:', error);
            return this.sendError(res, 'Failed to logout');
        }
    });

    /**
     * Get current user profile
     */
    getProfile = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const profile = await this.userModel.getUserProfile(user.id);

            if (!profile) {
                return this.sendNotFound(res, 'User profile');
            }

            return this.sendSuccess(res, profile, 'Profile retrieved successfully');

        } catch (error) {
            console.error('Error getting user profile:', error);
            return this.sendError(res, 'Failed to retrieve profile');
        }
    });

    /**
     * Update user profile
     */
    updateProfile = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            
            const allowedFields = [
                'first_name', 'last_name', 'phone', 'date_of_birth',
                'bio', 'avatar_url', 'preferences', 'timezone'
            ];

            const updateData = this.sanitizeInput(req.body, allowedFields);
            
            if (Object.keys(updateData).length === 0) {
                return this.sendError(res, 'No valid fields to update', 400);
            }

            const updatedProfile = await this.userModel.updateProfile(user.id, updateData);

            this.logRequest(req, 'UPDATE_PROFILE');
            return this.sendSuccess(res, updatedProfile, 'Profile updated successfully');

        } catch (error) {
            console.error('Error updating profile:', error);
            return this.sendError(res, 'Failed to update profile');
        }
    });

    /**
     * Change password
     */
    changePassword = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return this.sendError(res, 'Current password and new password are required', 400);
            }

            // Get user with password hash
            const userWithPassword = await this.userModel.findById(user.id);
            if (!userWithPassword) {
                return this.sendNotFound(res, 'User');
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password_hash);
            if (!isValidPassword) {
                return this.sendError(res, 'Current password is incorrect', 401);
            }

            // Validate new password strength
            const passwordValidation = this.userModel.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return this.sendError(res, passwordValidation.message, 400);
            }

            // Update password
            await this.userModel.updatePassword(user.id, newPassword);

            // Invalidate all existing sessions except current
            const currentToken = this.getTokenFromRequest(req);
            await this.userModel.invalidateAllSessions(user.id, currentToken);

            this.logRequest(req, 'CHANGE_PASSWORD');
            return this.sendSuccess(res, null, 'Password changed successfully');

        } catch (error) {
            console.error('Error changing password:', error);
            return this.sendError(res, 'Failed to change password');
        }
    });

    /**
     * Get user progress
     */
    getUserProgress = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const { courseId } = req.params;

            let progress;
            if (courseId) {
                if (!this.isValidUUID(courseId)) {
                    return this.sendError(res, 'Invalid course ID format', 400);
                }
                progress = await this.userModel.getCourseProgress(user.id, courseId);
            } else {
                progress = await this.userModel.getAllProgress(user.id);
            }

            return this.sendSuccess(res, progress, 'Progress retrieved successfully');

        } catch (error) {
            console.error('Error getting user progress:', error);
            return this.sendError(res, 'Failed to retrieve progress');
        }
    });

    /**
     * Update lesson progress
     */
    updateLessonProgress = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const { courseId, lessonId } = req.params;
            const { status, timeSpent, score } = req.body;

            if (!this.isValidUUID(courseId) || !this.isValidUUID(lessonId)) {
                return this.sendError(res, 'Invalid course or lesson ID format', 400);
            }

            const validStatuses = ['not_started', 'in_progress', 'completed'];
            if (status && !validStatuses.includes(status)) {
                return this.sendError(res, 'Invalid status value', 400);
            }

            const progressData = {
                status,
                time_spent: timeSpent,
                score,
                last_accessed: new Date().toISOString()
            };

            const progress = await this.userModel.updateLessonProgress(
                user.id, courseId, lessonId, progressData
            );

            this.logRequest(req, 'UPDATE_LESSON_PROGRESS');
            return this.sendSuccess(res, progress, 'Progress updated successfully');

        } catch (error) {
            console.error('Error updating lesson progress:', error);
            return this.sendError(res, 'Failed to update progress');
        }
    });

    /**
     * Get user dashboard data
     */
    getDashboard = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const dashboard = await this.userModel.getDashboardData(user.id);

            this.setCacheHeaders(res, 300); // Cache for 5 minutes
            return this.sendSuccess(res, dashboard, 'Dashboard data retrieved successfully');

        } catch (error) {
            console.error('Error getting dashboard data:', error);
            return this.sendError(res, 'Failed to retrieve dashboard data');
        }
    });

    /**
     * Request password reset
     */
    requestPasswordReset = this.asyncHandler(async (req, res) => {
        try {
            const { email } = req.body;

            if (!email || !this.isValidEmail(email)) {
                return this.sendError(res, 'Valid email is required', 400);
            }

            const user = await this.userModel.findByEmail(email);
            if (!user) {
                // Don't reveal if email exists or not
                return this.sendSuccess(res, null, 'If the email exists, a reset link has been sent');
            }

            // Generate reset token
            const resetToken = await this.userModel.generatePasswordResetToken(user.id);

            // In a real application, you would send an email here
            // For now, we'll just log it (remove in production)
            console.log(`Password reset token for ${email}: ${resetToken}`);

            this.logRequest(req, 'REQUEST_PASSWORD_RESET');
            return this.sendSuccess(res, null, 'If the email exists, a reset link has been sent');

        } catch (error) {
            console.error('Error requesting password reset:', error);
            return this.sendError(res, 'Failed to process password reset request');
        }
    });

    /**
     * Reset password with token
     */
    resetPassword = this.asyncHandler(async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return this.sendError(res, 'Reset token and new password are required', 400);
            }

            // Validate new password strength
            const passwordValidation = this.userModel.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return this.sendError(res, passwordValidation.message, 400);
            }

            // Reset password with token
            const success = await this.userModel.resetPasswordWithToken(token, newPassword);
            if (!success) {
                return this.sendError(res, 'Invalid or expired reset token', 400);
            }

            this.logRequest(req, 'RESET_PASSWORD');
            return this.sendSuccess(res, null, 'Password reset successfully');

        } catch (error) {
            console.error('Error resetting password:', error);
            return this.sendError(res, 'Failed to reset password');
        }
    });

    /**
     * Get user sessions (current user only)
     */
    getUserSessions = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const sessions = await this.userModel.getUserSessions(user.id);

            return this.sendSuccess(res, sessions, 'Sessions retrieved successfully');

        } catch (error) {
            console.error('Error getting user sessions:', error);
            return this.sendError(res, 'Failed to retrieve sessions');
        }
    });

    /**
     * Revoke session
     */
    revokeSession = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const { sessionId } = req.params;

            if (!this.isValidUUID(sessionId)) {
                return this.sendError(res, 'Invalid session ID format', 400);
            }

            const success = await this.userModel.revokeUserSession(user.id, sessionId);
            if (!success) {
                return this.sendNotFound(res, 'Session');
            }

            this.logRequest(req, 'REVOKE_SESSION');
            return this.sendSuccess(res, null, 'Session revoked successfully');

        } catch (error) {
            console.error('Error revoking session:', error);
            return this.sendError(res, 'Failed to revoke session');
        }
    });

    /**
     * Delete user account
     */
    deleteAccount = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            const { password } = req.body;

            if (!password) {
                return this.sendError(res, 'Password confirmation is required', 400);
            }

            // Get user with password hash
            const userWithPassword = await this.userModel.findById(user.id);
            if (!userWithPassword) {
                return this.sendNotFound(res, 'User');
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
            if (!isValidPassword) {
                return this.sendError(res, 'Password is incorrect', 401);
            }

            // Delete user account
            await this.userModel.deleteUser(user.id);

            // Clear auth cookie
            res.clearCookie('auth_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            this.logRequest(req, 'DELETE_ACCOUNT');
            return this.sendSuccess(res, null, 'Account deleted successfully');

        } catch (error) {
            console.error('Error deleting account:', error);
            return this.sendError(res, 'Failed to delete account');
        }
    });

    // Helper methods

    generateToken(user, expiresIn = '24h') {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn }
        );
    }

    setAuthCookie(res, token, rememberMe = false) {
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge
        });
    }

    getTokenFromRequest(req) {
        return req.cookies?.auth_token || 
               req.headers.authorization?.replace('Bearer ', '');
    }

    getCurrentUser(req) {
        return req.user;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = UserController;
