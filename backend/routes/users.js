const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock user data (replace with database later)
let mockUsers = [
    {
        id: 1,
        email: 'demo@learnbyshorts.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        name: 'Demo User',
        createdAt: new Date().toISOString(),
        preferences: {
            categories: ['science', 'technology'],
            difficulty: 'intermediate'
        }
    }
];

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and name are required'
            });
        }

        // Check if user already exists
        const existingUser = mockUsers.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = {
            id: mockUsers.length + 1,
            email,
            password: hashedPassword,
            name,
            createdAt: new Date().toISOString(),
            preferences: {
                categories: [],
                difficulty: 'beginner'
            }
        };

        mockUsers.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to register user',
            message: error.message
        });
    }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = mockUsers.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to login',
            message: error.message
        });
    }
});

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = mockUsers.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            message: error.message
        });
    }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, (req, res) => {
    try {
        const { name, preferences } = req.body;
        const userIndex = mockUsers.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update user data
        if (name) mockUsers[userIndex].name = name;
        if (preferences) mockUsers[userIndex].preferences = { ...mockUsers[userIndex].preferences, ...preferences };

        // Return updated user data (without password)
        const { password: _, ...userWithoutPassword } = mockUsers[userIndex];

        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            message: error.message
        });
    }
});

// GET /api/users/:id/progress - Get user progress
router.get('/:id/progress', authenticateToken, (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Check if user is accessing their own progress or is admin
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Mock progress data
        const mockProgress = {
            userId: userId,
            totalCourses: 3,
            completedCourses: 1,
            totalConcepts: 45,
            completedConcepts: 12,
            streakDays: 5,
            lastActivity: new Date().toISOString(),
            courseProgress: [
                {
                    courseId: 1,
                    courseName: 'Quantum Physics Fundamentals',
                    progress: 25,
                    completedConcepts: 3,
                    totalConcepts: 12,
                    lastAccessed: new Date().toISOString()
                },
                {
                    courseId: 2,
                    courseName: 'Machine Learning Basics',
                    progress: 67,
                    completedConcepts: 12,
                    totalConcepts: 18,
                    lastAccessed: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                }
            ]
        };

        res.json({
            success: true,
            data: mockProgress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch progress',
            message: error.message
        });
    }
});

module.exports = router;
