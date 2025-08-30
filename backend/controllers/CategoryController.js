/**
 * CategoryController - Handles category-related operations with hierarchical support
 */

const BaseController = require('./BaseController');
const Category = require('../models/Category');

class CategoryController extends BaseController {
    constructor() {
        super();
        this.categoryModel = new Category();
    }

    /**
     * Get all categories with hierarchical structure
     */
    getAllCategories = this.asyncHandler(async (req, res) => {
        try {
            const { includeInactive = false, flat = false } = req.query;
            
            const conditions = {};
            if (!includeInactive) {
                conditions.is_active = 1;
            }

            let categories;
            if (flat === 'true') {
                // Return flat list with pagination
                const { page, limit } = this.getPaginationParams(req);
                const sortBy = this.getSortParams(req, ['name', 'order_index', 'created_at']);
                
                categories = await this.categoryModel.findAll(conditions, sortBy, limit);
                const total = await this.categoryModel.count(conditions);

                const paginatedResponse = this.formatPaginatedResponse(categories, {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                });

                this.setCacheHeaders(res, 600); // Cache for 10 minutes
                return this.sendSuccess(res, paginatedResponse, 'Categories retrieved successfully');
            } else {
                // Return hierarchical structure
                categories = await this.categoryModel.getCategoryHierarchy(conditions);
                
                this.setCacheHeaders(res, 600);
                return this.sendSuccess(res, categories, 'Category hierarchy retrieved successfully');
            }

        } catch (error) {
            console.error('Error getting categories:', error);
            return this.sendError(res, 'Failed to retrieve categories');
        }
    });

    /**
     * Get category by ID with details
     */
    getCategoryById = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const { includeStats = false } = req.query;

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid category ID format', 400);
            }

            let category;
            if (includeStats === 'true') {
                category = await this.categoryModel.getCategoryWithStats(id);
            } else {
                category = await this.categoryModel.findById(id);
            }

            if (!category) {
                return this.sendNotFound(res, 'Category');
            }

            this.setCacheHeaders(res, 600);
            return this.sendSuccess(res, category, 'Category retrieved successfully');

        } catch (error) {
            console.error('Error getting category:', error);
            return this.sendError(res, 'Failed to retrieve category');
        }
    });

    /**
     * Get featured categories
     */
    getFeaturedCategories = this.asyncHandler(async (req, res) => {
        try {
            const limit = Math.min(12, parseInt(req.query.limit) || 6);
            const categories = await this.categoryModel.getFeaturedCategories(limit);

            this.setCacheHeaders(res, 600);
            return this.sendSuccess(res, categories, 'Featured categories retrieved successfully');

        } catch (error) {
            console.error('Error getting featured categories:', error);
            return this.sendError(res, 'Failed to retrieve featured categories');
        }
    });

    /**
     * Get category children
     */
    getCategoryChildren = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid category ID format', 400);
            }

            const category = await this.categoryModel.findById(id);
            if (!category) {
                return this.sendNotFound(res, 'Category');
            }

            const children = await this.categoryModel.getCategoryChildren(id);

            this.setCacheHeaders(res, 600);
            return this.sendSuccess(res, children, 'Category children retrieved successfully');

        } catch (error) {
            console.error('Error getting category children:', error);
            return this.sendError(res, 'Failed to retrieve category children');
        }
    });

    /**
     * Get category path (breadcrumb)
     */
    getCategoryPath = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid category ID format', 400);
            }

            const category = await this.categoryModel.findById(id);
            if (!category) {
                return this.sendNotFound(res, 'Category');
            }

            const path = await this.categoryModel.getCategoryPath(id);

            this.setCacheHeaders(res, 600);
            return this.sendSuccess(res, path, 'Category path retrieved successfully');

        } catch (error) {
            console.error('Error getting category path:', error);
            return this.sendError(res, 'Failed to retrieve category path');
        }
    });

    /**
     * Search categories
     */
    searchCategories = this.asyncHandler(async (req, res) => {
        try {
            const { q: query } = req.query;
            
            if (!query || query.trim().length < 2) {
                return this.sendError(res, 'Search query must be at least 2 characters', 400);
            }

            const limit = Math.min(50, parseInt(req.query.limit) || 20);
            const categories = await this.categoryModel.searchCategories(query.trim(), limit);

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, categories, 'Search completed successfully');

        } catch (error) {
            console.error('Error searching categories:', error);
            return this.sendError(res, 'Failed to search categories');
        }
    });

    /**
     * Create new category (Admin only)
     */
    createCategory = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const allowedFields = [
                'name', 'description', 'parent_id', 'icon_url', 'color',
                'is_featured', 'order_index', 'metadata'
            ];

            const categoryData = this.sanitizeInput(req.body, allowedFields);
            
            // Validate required fields
            const requiredFields = ['name'];
            const validationErrors = this.validateRequiredFields(categoryData, requiredFields);
            if (validationErrors.length > 0) {
                return this.sendValidationError(res, validationErrors);
            }

            // Validate parent category if provided
            if (categoryData.parent_id) {
                if (!this.isValidUUID(categoryData.parent_id)) {
                    return this.sendError(res, 'Invalid parent category ID format', 400);
                }

                const parentCategory = await this.categoryModel.findById(categoryData.parent_id);
                if (!parentCategory) {
                    return this.sendError(res, 'Parent category not found', 400);
                }

                // Check for circular reference
                const isCircular = await this.categoryModel.wouldCreateCircularReference(
                    null, categoryData.parent_id
                );
                if (isCircular) {
                    return this.sendError(res, 'Cannot create circular category reference', 400);
                }
            }

            const category = await this.categoryModel.create(categoryData);

            this.logRequest(req, 'CREATE_CATEGORY');
            return this.sendSuccess(res, category, 'Category created successfully', 201);

        } catch (error) {
            console.error('Error creating category:', error);
            if (error.message.includes('UNIQUE constraint failed')) {
                return this.sendError(res, 'Category name already exists', 409);
            }
            return this.sendError(res, 'Failed to create category');
        }
    });

    /**
     * Update category (Admin only)
     */
    updateCategory = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = this.getCurrentUser(req);

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid category ID format', 400);
            }

            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const category = await this.categoryModel.findById(id);
            if (!category) {
                return this.sendNotFound(res, 'Category');
            }

            const allowedFields = [
                'name', 'description', 'parent_id', 'icon_url', 'color',
                'is_featured', 'is_active', 'order_index', 'metadata'
            ];

            const updateData = this.sanitizeInput(req.body, allowedFields);
            
            if (Object.keys(updateData).length === 0) {
                return this.sendError(res, 'No valid fields to update', 400);
            }

            // Validate parent category if being updated
            if (updateData.parent_id !== undefined) {
                if (updateData.parent_id && !this.isValidUUID(updateData.parent_id)) {
                    return this.sendError(res, 'Invalid parent category ID format', 400);
                }

                if (updateData.parent_id) {
                    const parentCategory = await this.categoryModel.findById(updateData.parent_id);
                    if (!parentCategory) {
                        return this.sendError(res, 'Parent category not found', 400);
                    }

                    // Check for circular reference
                    const isCircular = await this.categoryModel.wouldCreateCircularReference(
                        id, updateData.parent_id
                    );
                    if (isCircular) {
                        return this.sendError(res, 'Cannot create circular category reference', 400);
                    }
                }
            }

            const updatedCategory = await this.categoryModel.update(id, updateData);

            this.logRequest(req, 'UPDATE_CATEGORY');
            return this.sendSuccess(res, updatedCategory, 'Category updated successfully');

        } catch (error) {
            console.error('Error updating category:', error);
            if (error.message.includes('UNIQUE constraint failed')) {
                return this.sendError(res, 'Category name already exists', 409);
            }
            return this.sendError(res, 'Failed to update category');
        }
    });

    /**
     * Delete category (Admin only)
     */
    deleteCategory = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = this.getCurrentUser(req);
            const { force = false } = req.query;

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid category ID format', 400);
            }

            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const category = await this.categoryModel.findById(id);
            if (!category) {
                return this.sendNotFound(res, 'Category');
            }

            // Check if category has children
            const children = await this.categoryModel.getCategoryChildren(id);
            if (children.length > 0 && force !== 'true') {
                return this.sendError(res, 
                    'Category has child categories. Use force=true to delete recursively', 
                    409
                );
            }

            // Check if category has courses
            const courseCount = await this.categoryModel.getCourseCount(id);
            if (courseCount > 0 && force !== 'true') {
                return this.sendError(res, 
                    `Category has ${courseCount} courses. Use force=true to proceed`, 
                    409
                );
            }

            await this.categoryModel.delete(id, force === 'true');

            this.logRequest(req, 'DELETE_CATEGORY');
            return this.sendSuccess(res, null, 'Category deleted successfully');

        } catch (error) {
            console.error('Error deleting category:', error);
            return this.sendError(res, 'Failed to delete category');
        }
    });

    /**
     * Reorder categories (Admin only)
     */
    reorderCategories = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const { categories } = req.body;
            
            if (!Array.isArray(categories) || categories.length === 0) {
                return this.sendError(res, 'Categories array is required', 400);
            }

            // Validate category IDs and order indices
            for (const cat of categories) {
                if (!cat.id || !this.isValidUUID(cat.id)) {
                    return this.sendError(res, 'Invalid category ID format', 400);
                }
                if (typeof cat.order_index !== 'number') {
                    return this.sendError(res, 'Order index must be a number', 400);
                }
            }

            await this.categoryModel.reorderCategories(categories);

            this.logRequest(req, 'REORDER_CATEGORIES');
            return this.sendSuccess(res, null, 'Categories reordered successfully');

        } catch (error) {
            console.error('Error reordering categories:', error);
            return this.sendError(res, 'Failed to reorder categories');
        }
    });

    /**
     * Get category statistics (Admin only)
     */
    getCategoryStats = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const stats = await this.categoryModel.getCategoryStatistics();

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, stats, 'Category statistics retrieved successfully');

        } catch (error) {
            console.error('Error getting category stats:', error);
            return this.sendError(res, 'Failed to retrieve category statistics');
        }
    });

    /**
     * Merge categories (Admin only)
     */
    mergeCategories = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const { sourceId, targetId } = req.body;

            if (!sourceId || !targetId || !this.isValidUUID(sourceId) || !this.isValidUUID(targetId)) {
                return this.sendError(res, 'Valid source and target category IDs are required', 400);
            }

            if (sourceId === targetId) {
                return this.sendError(res, 'Source and target categories cannot be the same', 400);
            }

            // Verify both categories exist
            const sourceCategory = await this.categoryModel.findById(sourceId);
            const targetCategory = await this.categoryModel.findById(targetId);

            if (!sourceCategory || !targetCategory) {
                return this.sendError(res, 'One or both categories not found', 404);
            }

            const result = await this.categoryModel.mergeCategories(sourceId, targetId);

            this.logRequest(req, 'MERGE_CATEGORIES');
            return this.sendSuccess(res, result, 'Categories merged successfully');

        } catch (error) {
            console.error('Error merging categories:', error);
            return this.sendError(res, 'Failed to merge categories');
        }
    });

    /**
     * Get category usage analytics (Admin only)
     */
    getCategoryAnalytics = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const { period = '30d' } = req.query;
            const analytics = await this.categoryModel.getCategoryAnalytics(period);

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, analytics, 'Category analytics retrieved successfully');

        } catch (error) {
            console.error('Error getting category analytics:', error);
            return this.sendError(res, 'Failed to retrieve category analytics');
        }
    });
}

module.exports = CategoryController;
