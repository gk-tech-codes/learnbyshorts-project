/**
 * User Model - Handles user authentication and profile management
 */

const BaseModel = require('./BaseModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User extends BaseModel {
    constructor() {
        super();
        this.tableName = 'users';
        this.primaryKey = 'id';
    }

    /**
     * Create users table
     */
    createTables() {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                avatar_url TEXT,
                role TEXT DEFAULT 'student',
                status TEXT DEFAULT 'active',
                email_verified BOOLEAN DEFAULT 0,
                email_verification_token TEXT,
                password_reset_token TEXT,
                password_reset_expires DATETIME,
                last_login DATETIME,
                login_attempts INTEGER DEFAULT 0,
                locked_until DATETIME,
                preferences TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createUserSessionsTable = `
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                session_token TEXT NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        const createUserProgressTable = `
            CREATE TABLE IF NOT EXISTS user_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                lesson_id TEXT,
                progress_percentage REAL DEFAULT 0,
                completed_at DATETIME,
                time_spent INTEGER DEFAULT 0,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                UNIQUE(user_id, course_id, lesson_id)
            )
        `;

        this.execute(createUsersTable);
        this.execute(createUserSessionsTable);
        this.execute(createUserProgressTable);
    }

    /**
     * Generate unique user ID
     */
    generateId() {
        return crypto.randomUUID();
    }

    /**
     * Hash password
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Verify password
     */
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generate secure token
     */
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Create user account
     */
    async createUser(userData) {
        const validation = this.validate(userData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Check if email already exists
        const existingUser = await this.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Check if username already exists (if provided)
        if (userData.username) {
            const existingUsername = await this.findOne({ username: userData.username });
            if (existingUsername) {
                throw new Error('Username already taken');
            }
        }

        const sanitizedData = this.sanitize(userData);
        sanitizedData.id = this.generateId();
        sanitizedData.password_hash = await this.hashPassword(userData.password);
        sanitizedData.email_verification_token = this.generateToken();

        // Handle preferences and metadata
        if (sanitizedData.preferences && typeof sanitizedData.preferences === 'object') {
            sanitizedData.preferences = JSON.stringify(sanitizedData.preferences);
        }
        if (sanitizedData.metadata && typeof sanitizedData.metadata === 'object') {
            sanitizedData.metadata = JSON.stringify(sanitizedData.metadata);
        }

        // Remove plain password from data
        delete sanitizedData.password;

        const user = await this.create(sanitizedData);
        
        // Remove sensitive data from returned user
        return this.sanitizeUserData(user);
    }

    /**
     * Authenticate user
     */
    async authenticateUser(email, password, ipAddress = null, userAgent = null) {
        const user = await this.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            throw new Error('Account is temporarily locked. Please try again later.');
        }

        // Check if account is active
        if (user.status !== 'active') {
            throw new Error('Account is not active');
        }

        // Verify password
        const isValidPassword = await this.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            await this.handleFailedLogin(user.id);
            throw new Error('Invalid credentials');
        }

        // Reset login attempts on successful login
        await this.resetLoginAttempts(user.id);

        // Update last login
        await this.updateLastLogin(user.id);

        // Create session
        const session = await this.createSession(user.id, ipAddress, userAgent);

        return {
            user: this.sanitizeUserData(user),
            session
        };
    }

    /**
     * Handle failed login attempt
     */
    async handleFailedLogin(userId) {
        const user = await this.findById(userId);
        const attempts = (user.login_attempts || 0) + 1;
        const maxAttempts = 5;
        const lockDuration = 30 * 60 * 1000; // 30 minutes

        let updateData = { login_attempts: attempts };

        if (attempts >= maxAttempts) {
            updateData.locked_until = new Date(Date.now() + lockDuration).toISOString();
        }

        await this.update(userId, updateData);
    }

    /**
     * Reset login attempts
     */
    async resetLoginAttempts(userId) {
        await this.update(userId, {
            login_attempts: 0,
            locked_until: null
        });
    }

    /**
     * Update last login
     */
    async updateLastLogin(userId) {
        await this.update(userId, {
            last_login: new Date().toISOString()
        });
    }

    /**
     * Create user session
     */
    async createSession(userId, ipAddress = null, userAgent = null) {
        const sessionId = this.generateId();
        const sessionToken = this.generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const session = {
            id: sessionId,
            user_id: userId,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString(),
            ip_address: ipAddress,
            user_agent: userAgent,
            is_active: true
        };

        const sql = `
            INSERT INTO user_sessions (id, user_id, session_token, expires_at, ip_address, user_agent, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.execute(sql, [
            session.id,
            session.user_id,
            session.session_token,
            session.expires_at,
            session.ip_address,
            session.user_agent,
            session.is_active,
            new Date().toISOString()
        ]);

        return session;
    }

    /**
     * Validate session
     */
    async validateSession(sessionToken) {
        const sql = `
            SELECT s.*, u.* FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.is_active = 1 AND s.expires_at > ?
        `;

        const result = await this.queryOne(sql, [sessionToken, new Date().toISOString()]);
        if (!result) return null;

        return {
            session: {
                id: result.id,
                user_id: result.user_id,
                session_token: result.session_token,
                expires_at: result.expires_at,
                ip_address: result.ip_address,
                user_agent: result.user_agent
            },
            user: this.sanitizeUserData({
                id: result.user_id,
                username: result.username,
                email: result.email,
                first_name: result.first_name,
                last_name: result.last_name,
                avatar_url: result.avatar_url,
                role: result.role,
                status: result.status,
                preferences: result.preferences,
                metadata: result.metadata
            })
        };
    }

    /**
     * Invalidate session
     */
    async invalidateSession(sessionToken) {
        const sql = `UPDATE user_sessions SET is_active = 0 WHERE session_token = ?`;
        await this.execute(sql, [sessionToken]);
    }

    /**
     * Invalidate all user sessions
     */
    async invalidateAllUserSessions(userId) {
        const sql = `UPDATE user_sessions SET is_active = 0 WHERE user_id = ?`;
        await this.execute(sql, [userId]);
    }

    /**
     * Clean expired sessions
     */
    async cleanExpiredSessions() {
        const sql = `DELETE FROM user_sessions WHERE expires_at < ?`;
        await this.execute(sql, [new Date().toISOString()]);
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, profileData) {
        const allowedFields = ['first_name', 'last_name', 'username', 'avatar_url', 'preferences'];
        const updateData = {};

        // Only allow specific fields to be updated
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                updateData[field] = profileData[field];
            }
        }

        // Handle preferences
        if (updateData.preferences && typeof updateData.preferences === 'object') {
            updateData.preferences = JSON.stringify(updateData.preferences);
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No valid fields to update');
        }

        const updatedUser = await this.update(userId, updateData);
        return this.sanitizeUserData(updatedUser);
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        const validation = this.validatePassword(newPassword);
        if (!validation.isValid) {
            throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
        }

        // Hash new password
        const newPasswordHash = await this.hashPassword(newPassword);

        // Update password
        await this.update(userId, {
            password_hash: newPasswordHash,
            password_reset_token: null,
            password_reset_expires: null
        });

        // Invalidate all sessions except current one
        await this.invalidateAllUserSessions(userId);

        return true;
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        const user = await this.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return { success: true };
        }

        const resetToken = this.generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.update(user.id, {
            password_reset_token: resetToken,
            password_reset_expires: resetExpires.toISOString()
        });

        return {
            success: true,
            resetToken // In production, send this via email
        };
    }

    /**
     * Reset password with token
     */
    async resetPassword(resetToken, newPassword) {
        const user = await this.findOne({
            password_reset_token: resetToken
        });

        if (!user || !user.password_reset_expires || 
            new Date(user.password_reset_expires) < new Date()) {
            throw new Error('Invalid or expired reset token');
        }

        // Validate new password
        const validation = this.validatePassword(newPassword);
        if (!validation.isValid) {
            throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
        }

        // Hash new password
        const newPasswordHash = await this.hashPassword(newPassword);

        // Update password and clear reset token
        await this.update(user.id, {
            password_hash: newPasswordHash,
            password_reset_token: null,
            password_reset_expires: null,
            login_attempts: 0,
            locked_until: null
        });

        // Invalidate all sessions
        await this.invalidateAllUserSessions(user.id);

        return true;
    }

    /**
     * Get user progress
     */
    async getUserProgress(userId, courseId = null) {
        let sql = `
            SELECT up.*, c.title as course_title, l.title as lesson_title
            FROM user_progress up
            LEFT JOIN courses c ON up.course_id = c.id
            LEFT JOIN lessons l ON up.lesson_id = l.id
            WHERE up.user_id = ?
        `;
        const params = [userId];

        if (courseId) {
            sql += ` AND up.course_id = ?`;
            params.push(courseId);
        }

        sql += ` ORDER BY up.last_accessed DESC`;

        const progress = await this.query(sql, params);
        return progress.map(p => {
            if (p.metadata) p.metadata = JSON.parse(p.metadata);
            return p;
        });
    }

    /**
     * Update user progress
     */
    async updateProgress(userId, courseId, lessonId, progressData) {
        const existingProgress = await this.queryOne(
            `SELECT * FROM user_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?`,
            [userId, courseId, lessonId]
        );

        const progressId = existingProgress ? existingProgress.id : this.generateId();
        const now = new Date().toISOString();

        const data = {
            progress_percentage: progressData.progress_percentage || 0,
            time_spent: progressData.time_spent || 0,
            last_accessed: now,
            metadata: JSON.stringify(progressData.metadata || {})
        };

        if (progressData.progress_percentage >= 100) {
            data.completed_at = now;
        }

        if (existingProgress) {
            // Update existing progress
            data.updated_at = now;
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const sql = `UPDATE user_progress SET ${setClause} WHERE id = ?`;
            await this.execute(sql, [...Object.values(data), progressId]);
        } else {
            // Create new progress record
            data.id = progressId;
            data.user_id = userId;
            data.course_id = courseId;
            data.lesson_id = lessonId;
            data.created_at = now;
            data.updated_at = now;

            const columns = Object.keys(data).join(', ');
            const placeholders = Object.keys(data).map(() => '?').join(', ');
            const sql = `INSERT INTO user_progress (${columns}) VALUES (${placeholders})`;
            await this.execute(sql, Object.values(data));
        }

        return await this.queryOne(
            `SELECT * FROM user_progress WHERE id = ?`,
            [progressId]
        );
    }

    /**
     * Sanitize user data (remove sensitive information)
     */
    sanitizeUserData(user) {
        if (!user) return null;

        const sanitized = { ...user };
        delete sanitized.password_hash;
        delete sanitized.email_verification_token;
        delete sanitized.password_reset_token;
        delete sanitized.password_reset_expires;
        delete sanitized.login_attempts;
        delete sanitized.locked_until;

        // Parse JSON fields
        if (sanitized.preferences && typeof sanitized.preferences === 'string') {
            sanitized.preferences = JSON.parse(sanitized.preferences);
        }
        if (sanitized.metadata && typeof sanitized.metadata === 'string') {
            sanitized.metadata = JSON.parse(sanitized.metadata);
        }

        return sanitized;
    }

    /**
     * Validate user data
     */
    validate(data) {
        const errors = [];

        // Email validation
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Valid email is required');
        }

        // Password validation
        if (data.password) {
            const passwordValidation = this.validatePassword(data.password);
            if (!passwordValidation.isValid) {
                errors.push(...passwordValidation.errors);
            }
        }

        // Username validation (if provided)
        if (data.username && !this.isValidUsername(data.username)) {
            errors.push('Username must be 3-30 characters and contain only letters, numbers, and underscores');
        }

        // Role validation
        if (data.role && !['student', 'instructor', 'admin'].includes(data.role)) {
            errors.push('Invalid role');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate password
     */
    validatePassword(password) {
        const errors = [];

        if (!password || password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/(?=.*[@$!%*?&])/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate username format
     */
    isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        return usernameRegex.test(username);
    }

    /**
     * Sanitize user input
     */
    sanitize(data) {
        const sanitized = { ...data };

        // Trim strings
        if (sanitized.email) sanitized.email = sanitized.email.trim().toLowerCase();
        if (sanitized.username) sanitized.username = sanitized.username.trim();
        if (sanitized.first_name) sanitized.first_name = sanitized.first_name.trim();
        if (sanitized.last_name) sanitized.last_name = sanitized.last_name.trim();

        return sanitized;
    }
}

module.exports = User;
