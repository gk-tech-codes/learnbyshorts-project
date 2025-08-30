/**
 * Course Routes - API endpoints for course management with configurable schedules
 */

const express = require('express');
const CourseController = require('../controllers/CourseController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { apiRateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const courseController = new CourseController();

// Public routes
router.get('/', apiRateLimit, courseController.getAllCourses);
router.get('/featured', apiRateLimit, courseController.getFeaturedCourses);
router.get('/search', apiRateLimit, courseController.searchCourses);
router.get('/templates', authenticateToken, requireRole('instructor'), courseController.getCourseTemplates);
router.get('/category/:categoryId', apiRateLimit, courseController.getCoursesByCategory);
router.get('/:id', apiRateLimit, courseController.getCourseById);
router.get('/:id/schedules', apiRateLimit, courseController.getCourseSchedules);

// Protected routes - Instructor/Admin only
router.post('/', 
    authenticateToken, 
    requireRole('instructor'),
    validateRequest([
        'title',
        'category_id'
    ]),
    courseController.createCourse
);

router.put('/:id', 
    authenticateToken, 
    requireRole('instructor'),
    courseController.updateCourse
);

router.delete('/:id', 
    authenticateToken, 
    requireRole('admin'),
    courseController.deleteCourse
);

// Course schedule management
router.post('/:id/schedules', 
    authenticateToken, 
    requireRole('instructor'),
    validateRequest([
        'name',
        'config'
    ]),
    courseController.createCourseSchedule
);

router.put('/:id/schedules/:scheduleId', 
    authenticateToken, 
    requireRole('instructor'),
    courseController.updateCourseSchedule
);

// Template-based course creation
router.post('/template/:templateId', 
    authenticateToken, 
    requireRole('instructor'),
    validateRequest([
        'title',
        'category_id'
    ]),
    courseController.createFromTemplate
);

// Lesson management
router.post('/:id/lessons', 
    authenticateToken, 
    requireRole('instructor'),
    validateRequest([
        'title'
    ]),
    courseController.addLesson
);

// Statistics (Admin/Instructor only)
router.get('/admin/stats', 
    authenticateToken, 
    requireRole('instructor'),
    courseController.getCourseStats
);

module.exports = router;
