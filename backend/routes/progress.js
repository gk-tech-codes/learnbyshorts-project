const express = require('express');
const router = express.Router();

// Mock progress data (replace with database later)
let mockProgress = [
    {
        id: 1,
        userId: 1,
        courseId: 1,
        conceptId: 1,
        completed: true,
        timeSpent: 45, // seconds
        timestamp: new Date().toISOString()
    },
    {
        id: 2,
        userId: 1,
        courseId: 1,
        conceptId: 2,
        completed: false,
        timeSpent: 23,
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
];

// POST /api/progress - Update user progress
router.post('/', (req, res) => {
    try {
        const { userId, courseId, conceptId, completed = false, timeSpent = 0 } = req.body;

        // Validation
        if (!userId || !courseId || !conceptId) {
            return res.status(400).json({
                success: false,
                error: 'userId, courseId, and conceptId are required'
            });
        }

        // Check if progress entry already exists
        const existingProgressIndex = mockProgress.findIndex(p => 
            p.userId === userId && p.courseId === courseId && p.conceptId === conceptId
        );

        if (existingProgressIndex !== -1) {
            // Update existing progress
            mockProgress[existingProgressIndex] = {
                ...mockProgress[existingProgressIndex],
                completed,
                timeSpent: mockProgress[existingProgressIndex].timeSpent + timeSpent,
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: mockProgress[existingProgressIndex]
            });
        } else {
            // Create new progress entry
            const newProgress = {
                id: mockProgress.length + 1,
                userId,
                courseId,
                conceptId,
                completed,
                timeSpent,
                timestamp: new Date().toISOString()
            };

            mockProgress.push(newProgress);

            res.status(201).json({
                success: true,
                data: newProgress
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update progress',
            message: error.message
        });
    }
});

// GET /api/progress/user/:userId - Get all progress for a user
router.get('/user/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const userProgress = mockProgress.filter(p => p.userId === userId);

        // Calculate summary statistics
        const totalConcepts = userProgress.length;
        const completedConcepts = userProgress.filter(p => p.completed).length;
        const totalTimeSpent = userProgress.reduce((sum, p) => sum + p.timeSpent, 0);

        res.json({
            success: true,
            data: {
                userId,
                totalConcepts,
                completedConcepts,
                completionRate: totalConcepts > 0 ? (completedConcepts / totalConcepts * 100).toFixed(1) : 0,
                totalTimeSpent,
                progress: userProgress
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user progress',
            message: error.message
        });
    }
});

// GET /api/progress/course/:courseId/user/:userId - Get progress for a specific course
router.get('/course/:courseId/user/:userId', (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const userId = parseInt(req.params.userId);

        const courseProgress = mockProgress.filter(p => 
            p.courseId === courseId && p.userId === userId
        );

        // Calculate course-specific statistics
        const totalConcepts = courseProgress.length;
        const completedConcepts = courseProgress.filter(p => p.completed).length;
        const totalTimeSpent = courseProgress.reduce((sum, p) => sum + p.timeSpent, 0);

        res.json({
            success: true,
            data: {
                courseId,
                userId,
                totalConcepts,
                completedConcepts,
                completionRate: totalConcepts > 0 ? (completedConcepts / totalConcepts * 100).toFixed(1) : 0,
                totalTimeSpent,
                progress: courseProgress
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course progress',
            message: error.message
        });
    }
});

// GET /api/progress/concept/:conceptId/user/:userId - Get progress for a specific concept
router.get('/concept/:conceptId/user/:userId', (req, res) => {
    try {
        const conceptId = parseInt(req.params.conceptId);
        const userId = parseInt(req.params.userId);

        const conceptProgress = mockProgress.find(p => 
            p.conceptId === conceptId && p.userId === userId
        );

        if (!conceptProgress) {
            return res.status(404).json({
                success: false,
                error: 'Progress not found for this concept'
            });
        }

        res.json({
            success: true,
            data: conceptProgress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch concept progress',
            message: error.message
        });
    }
});

// DELETE /api/progress/:id - Delete progress entry
router.delete('/:id', (req, res) => {
    try {
        const progressId = parseInt(req.params.id);
        const progressIndex = mockProgress.findIndex(p => p.id === progressId);

        if (progressIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Progress entry not found'
            });
        }

        const deletedProgress = mockProgress.splice(progressIndex, 1)[0];

        res.json({
            success: true,
            data: deletedProgress,
            message: 'Progress entry deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete progress',
            message: error.message
        });
    }
});

// GET /api/progress/analytics/user/:userId - Get detailed analytics for a user
router.get('/analytics/user/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const userProgress = mockProgress.filter(p => p.userId === userId);

        if (userProgress.length === 0) {
            return res.json({
                success: true,
                data: {
                    userId,
                    message: 'No progress data found',
                    analytics: null
                }
            });
        }

        // Calculate detailed analytics
        const totalConcepts = userProgress.length;
        const completedConcepts = userProgress.filter(p => p.completed).length;
        const totalTimeSpent = userProgress.reduce((sum, p) => sum + p.timeSpent, 0);
        const averageTimePerConcept = totalTimeSpent / totalConcepts;

        // Group by course
        const courseStats = {};
        userProgress.forEach(p => {
            if (!courseStats[p.courseId]) {
                courseStats[p.courseId] = {
                    courseId: p.courseId,
                    totalConcepts: 0,
                    completedConcepts: 0,
                    totalTimeSpent: 0
                };
            }
            courseStats[p.courseId].totalConcepts++;
            if (p.completed) courseStats[p.courseId].completedConcepts++;
            courseStats[p.courseId].totalTimeSpent += p.timeSpent;
        });

        // Calculate learning streak (simplified)
        const sortedProgress = userProgress
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        let currentStreak = 0;
        let lastDate = null;
        
        for (const progress of sortedProgress) {
            const progressDate = new Date(progress.timestamp).toDateString();
            if (lastDate === null) {
                currentStreak = 1;
                lastDate = progressDate;
            } else if (lastDate !== progressDate) {
                const daysDiff = Math.floor((new Date(lastDate) - new Date(progressDate)) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    currentStreak++;
                    lastDate = progressDate;
                } else {
                    break;
                }
            }
        }

        const analytics = {
            userId,
            totalConcepts,
            completedConcepts,
            completionRate: (completedConcepts / totalConcepts * 100).toFixed(1),
            totalTimeSpent,
            averageTimePerConcept: Math.round(averageTimePerConcept),
            currentStreak,
            courseStats: Object.values(courseStats),
            recentActivity: sortedProgress.slice(0, 10) // Last 10 activities
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
            message: error.message
        });
    }
});

module.exports = router;
