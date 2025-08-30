/**
 * Category Routes - API endpoints for hierarchical category management
 */

const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { apiRateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const categoryController = new CategoryController();

// Public routes
router.get('/', apiRateLimit, categoryController.getAllCategories);
router.get('/featured', apiRateLimit, categoryController.getFeaturedCategories);
router.get('/search', apiRateLimit, categoryController.searchCategories);
router.get('/:id', apiRateLimit, categoryController.getCategoryById);
router.get('/:id/children', apiRateLimit, categoryController.getCategoryChildren);
router.get('/:id/path', apiRateLimit, categoryController.getCategoryPath);

// Protected routes - Admin only
router.post('/', 
    authenticateToken, 
    requireRole('admin'),
    validateRequest([
        'name'
    ]),
    categoryController.createCategory
);

router.put('/:id', 
    authenticateToken, 
    requireRole('admin'),
    categoryController.updateCategory
);

router.delete('/:id', 
    authenticateToken, 
    requireRole('admin'),
    categoryController.deleteCategory
);

// Category management operations
router.post('/reorder', 
    authenticateToken, 
    requireRole('admin'),
    validateRequest([
        'categories'
    ]),
    categoryController.reorderCategories
);

router.post('/merge', 
    authenticateToken, 
    requireRole('admin'),
    validateRequest([
        'sourceId',
        'targetId'
    ]),
    categoryController.mergeCategories
);

// Analytics and statistics (Admin only)
router.get('/admin/stats', 
    authenticateToken, 
    requireRole('admin'),
    categoryController.getCategoryStats
);

router.get('/admin/analytics', 
    authenticateToken, 
    requireRole('admin'),
    categoryController.getCategoryAnalytics
);

module.exports = router;
