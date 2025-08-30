/**
 * CourseController - Handles course-related operations with configurable schedules
 */

const BaseController = require('./BaseController');
const Course = require('../models/Course');
const Category = require('../models/Category');

class CourseController extends BaseController {
    constructor() {
        super();
        this.courseModel = new Course();
        this.categoryModel = new Category();
    }

    /**
     * Get all courses with pagination and filtering
     */
    getAllCourses = this.asyncHandler(async (req, res) => {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const sortBy = this.getSortParams(req, ['title', 'created_at', 'difficulty_level']);
            const filters = this.getFilterParams(req, ['category_id', 'difficulty_level', 'status']);

            // Build query conditions
            const conditions = { status: 'published', ...filters };

            const courses = await this.courseModel.findAll(conditions, sortBy, limit);
            const total = await this.courseModel.count(conditions);

            const paginatedResponse = this.formatPaginatedResponse(courses, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });

            this.setCacheHeaders(res, 300); // Cache for 5 minutes
            return this.sendSuccess(res, paginatedResponse, 'Courses retrieved successfully');

        } catch (error) {
            console.error('Error getting courses:', error);
            return this.sendError(res, 'Failed to retrieve courses');
        }
    });

    /**
     * Get course by ID with full details
     */
    getCourseById = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid course ID format', 400);
            }

            const course = await this.courseModel.getCourseDetails(id);
            if (!course) {
                return this.sendNotFound(res, 'Course');
            }

            // Check if course is published or user has permission to view
            const user = this.getCurrentUser(req);
            if (course.status !== 'published' && !this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Course not available');
            }

            this.setCacheHeaders(res, 600); // Cache for 10 minutes
            return this.sendSuccess(res, course, 'Course retrieved successfully');

        } catch (error) {
            console.error('Error getting course:', error);
            return this.sendError(res, 'Failed to retrieve course');
        }
    });

    /**
     * Get courses by category
     */
    getCoursesByCategory = this.asyncHandler(async (req, res) => {
        try {
            const { categoryId } = req.params;
            const { page, limit } = this.getPaginationParams(req);

            if (!this.isValidUUID(categoryId)) {
                return this.sendError(res, 'Invalid category ID format', 400);
            }

            // Verify category exists
            const category = await this.categoryModel.findById(categoryId);
            if (!category) {
                return this.sendNotFound(res, 'Category');
            }

            const result = await this.courseModel.getCoursesByCategory(categoryId, page, limit);

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, result, 'Courses retrieved successfully');

        } catch (error) {
            console.error('Error getting courses by category:', error);
            return this.sendError(res, 'Failed to retrieve courses');
        }
    });

    /**
     * Get featured courses
     */
    getFeaturedCourses = this.asyncHandler(async (req, res) => {
        try {
            const limit = Math.min(12, parseInt(req.query.limit) || 6);
            const courses = await this.courseModel.getFeaturedCourses(limit);

            this.setCacheHeaders(res, 600);
            return this.sendSuccess(res, courses, 'Featured courses retrieved successfully');

        } catch (error) {
            console.error('Error getting featured courses:', error);
            return this.sendError(res, 'Failed to retrieve featured courses');
        }
    });

    /**
     * Search courses
     */
    searchCourses = this.asyncHandler(async (req, res) => {
        try {
            const { q: query } = req.query;
            
            if (!query || query.trim().length < 2) {
                return this.sendError(res, 'Search query must be at least 2 characters', 400);
            }

            const filters = this.getFilterParams(req, ['category_id', 'difficulty_level']);
            filters.limit = Math.min(50, parseInt(req.query.limit) || 20);

            const courses = await this.courseModel.searchCourses(query.trim(), filters);

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, courses, 'Search completed successfully');

        } catch (error) {
            console.error('Error searching courses:', error);
            return this.sendError(res, 'Failed to search courses');
        }
    });

    /**
     * Create new course (Admin/Instructor only)
     */
    createCourse = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const allowedFields = [
                'title', 'description', 'category_id', 'difficulty_level',
                'estimated_duration', 'thumbnail_url', 'is_featured',
                'order_index', 'metadata', 'schedule_config', 'defaultSchedule'
            ];

            const courseData = this.sanitizeInput(req.body, allowedFields);
            
            // Validate required fields
            const requiredFields = ['title', 'category_id'];
            const validationErrors = this.validateRequiredFields(courseData, requiredFields);
            if (validationErrors.length > 0) {
                return this.sendValidationError(res, validationErrors);
            }

            // Verify category exists
            const category = await this.categoryModel.findById(courseData.category_id);
            if (!category) {
                return this.sendError(res, 'Invalid category ID', 400);
            }

            // Add creator information
            courseData.metadata = {
                ...courseData.metadata,
                created_by: user.id,
                creator_name: `${user.first_name} ${user.last_name}`.trim()
            };

            const course = await this.courseModel.createCourse(courseData);

            this.logRequest(req, 'CREATE_COURSE');
            return this.sendSuccess(res, course, 'Course created successfully', 201);

        } catch (error) {
            console.error('Error creating course:', error);
            if (error.message.includes('Validation failed')) {
                return this.sendError(res, error.message, 400);
            }
            return this.sendError(res, 'Failed to create course');
        }
    });

    /**
     * Update course (Admin/Instructor only)
     */
    updateCourse = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = this.getCurrentUser(req);

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid course ID format', 400);
            }

            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const course = await this.courseModel.findById(id);
            if (!course) {
                return this.sendNotFound(res, 'Course');
            }

            // Check ownership for instructors (admins can edit any course)
            if (!this.hasRole(user, 'admin')) {
                const courseMetadata = course.metadata ? JSON.parse(course.metadata) : {};
                if (courseMetadata.created_by !== user.id) {
                    return this.sendForbidden(res, 'You can only edit your own courses');
                }
            }

            const allowedFields = [
                'title', 'description', 'difficulty_level', 'estimated_duration',
                'thumbnail_url', 'status', 'is_featured', 'order_index',
                'metadata', 'schedule_config'
            ];

            const updateData = this.sanitizeInput(req.body, allowedFields);
            
            if (Object.keys(updateData).length === 0) {
                return this.sendError(res, 'No valid fields to update', 400);
            }

            const updatedCourse = await this.courseModel.update(id, updateData);

            this.logRequest(req, 'UPDATE_COURSE');
            return this.sendSuccess(res, updatedCourse, 'Course updated successfully');

        } catch (error) {
            console.error('Error updating course:', error);
            return this.sendError(res, 'Failed to update course');
        }
    });

    /**
     * Delete course (Admin only)
     */
    deleteCourse = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = this.getCurrentUser(req);

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid course ID format', 400);
            }

            if (!this.hasRole(user, 'admin')) {
                return this.sendForbidden(res, 'Admin access required');
            }

            const course = await this.courseModel.findById(id);
            if (!course) {
                return this.sendNotFound(res, 'Course');
            }

            await this.courseModel.delete(id);

            this.logRequest(req, 'DELETE_COURSE');
            return this.sendSuccess(res, null, 'Course deleted successfully');

        } catch (error) {
            console.error('Error deleting course:', error);
            return this.sendError(res, 'Failed to delete course');
        }
    });

    /**
     * Get course schedules
     */
    getCourseSchedules = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid course ID format', 400);
            }

            const course = await this.courseModel.findById(id);
            if (!course) {
                return this.sendNotFound(res, 'Course');
            }

            const schedules = await this.courseModel.getCourseSchedules(id);

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, schedules, 'Course schedules retrieved successfully');

        } catch (error) {
            console.error('Error getting course schedules:', error);
            return this.sendError(res, 'Failed to retrieve course schedules');
        }
    });

    /**
     * Create course schedule (Admin/Instructor only)
     */
    createCourseSchedule = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = this.getCurrentUser(req);

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid course ID format', 400);
            }

            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const course = await this.courseModel.findById(id);
            if (!course) {
                return this.sendNotFound(res, 'Course');
            }

            const allowedFields = ['name', 'type', 'config', 'is_active'];
            const scheduleData = this.sanitizeInput(req.body, allowedFields);

            // Validate required fields
            const requiredFields = ['name', 'config'];
            const validationErrors = this.validateRequiredFields(scheduleData, requiredFields);
            if (validationErrors.length > 0) {
                return this.sendValidationError(res, validationErrors);
            }

            const schedule = await this.courseModel.createCourseSchedule(id, scheduleData);

            this.logRequest(req, 'CREATE_COURSE_SCHEDULE');
            return this.sendSuccess(res, schedule, 'Course schedule created successfully', 201);

        } catch (error) {
            console.error('Error creating course schedule:', error);
            return this.sendError(res, 'Failed to create course schedule');
        }
    });

    /**
     * Update course schedule (Admin/Instructor only)
     */
    updateCourseSchedule = this.asyncHandler(async (req, res) => {
        try {
            const { id, scheduleId } = req.params;
            const user = this.getCurrentUser(req);

            if (!this.isValidUUID(id) || !this.isValidUUID(scheduleId)) {
                return this.sendError(res, 'Invalid ID format', 400);
            }

            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const schedule = await this.courseModel.getCourseScheduleById(scheduleId);
            if (!schedule || schedule.course_id !== id) {
                return this.sendNotFound(res, 'Course schedule');
            }

            const allowedFields = ['schedule_name', 'schedule_type', 'schedule_config', 'is_active'];
            const updateData = this.sanitizeInput(req.body, allowedFields);

            if (Object.keys(updateData).length === 0) {
                return this.sendError(res, 'No valid fields to update', 400);
            }

            const updatedSchedule = await this.courseModel.updateCourseSchedule(scheduleId, updateData);

            this.logRequest(req, 'UPDATE_COURSE_SCHEDULE');
            return this.sendSuccess(res, updatedSchedule, 'Course schedule updated successfully');

        } catch (error) {
            console.error('Error updating course schedule:', error);
            return this.sendError(res, 'Failed to update course schedule');
        }
    });

    /**
     * Create course from template (Admin/Instructor only)
     */
    createFromTemplate = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const { templateId } = req.params;
            if (!this.isValidUUID(templateId)) {
                return this.sendError(res, 'Invalid template ID format', 400);
            }

            const allowedFields = [
                'title', 'description', 'category_id', 'difficulty_level',
                'estimated_duration', 'thumbnail_url', 'metadata'
            ];

            const courseData = this.sanitizeInput(req.body, allowedFields);

            // Validate required fields
            const requiredFields = ['title', 'category_id'];
            const validationErrors = this.validateRequiredFields(courseData, requiredFields);
            if (validationErrors.length > 0) {
                return this.sendValidationError(res, validationErrors);
            }

            // Add creator information
            courseData.metadata = {
                ...courseData.metadata,
                created_by: user.id,
                creator_name: `${user.first_name} ${user.last_name}`.trim()
            };

            const course = await this.courseModel.createFromTemplate(templateId, courseData);

            this.logRequest(req, 'CREATE_COURSE_FROM_TEMPLATE');
            return this.sendSuccess(res, course, 'Course created from template successfully', 201);

        } catch (error) {
            console.error('Error creating course from template:', error);
            if (error.message.includes('Template not found')) {
                return this.sendNotFound(res, 'Template');
            }
            return this.sendError(res, 'Failed to create course from template');
        }
    });

    /**
     * Get course templates
     */
    getCourseTemplates = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const { category } = req.query;
            const templates = await this.courseModel.getCourseTemplates(category);

            this.setCacheHeaders(res, 600);
            return this.sendSuccess(res, templates, 'Course templates retrieved successfully');

        } catch (error) {
            console.error('Error getting course templates:', error);
            return this.sendError(res, 'Failed to retrieve course templates');
        }
    });

    /**
     * Add lesson to course (Admin/Instructor only)
     */
    addLesson = this.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = this.getCurrentUser(req);

            if (!this.isValidUUID(id)) {
                return this.sendError(res, 'Invalid course ID format', 400);
            }

            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            const course = await this.courseModel.findById(id);
            if (!course) {
                return this.sendNotFound(res, 'Course');
            }

            const allowedFields = [
                'title', 'description', 'content', 'duration', 'order_index',
                'lesson_type', 'resources', 'prerequisites', 'learning_objectives'
            ];

            const lessonData = this.sanitizeInput(req.body, allowedFields);

            // Validate required fields
            const requiredFields = ['title'];
            const validationErrors = this.validateRequiredFields(lessonData, requiredFields);
            if (validationErrors.length > 0) {
                return this.sendValidationError(res, validationErrors);
            }

            const lesson = await this.courseModel.createLesson(id, lessonData);

            this.logRequest(req, 'ADD_LESSON');
            return this.sendSuccess(res, lesson, 'Lesson added successfully', 201);

        } catch (error) {
            console.error('Error adding lesson:', error);
            return this.sendError(res, 'Failed to add lesson');
        }
    });

    /**
     * Get course statistics (Admin/Instructor only)
     */
    getCourseStats = this.asyncHandler(async (req, res) => {
        try {
            const user = this.getCurrentUser(req);
            if (!this.hasRole(user, 'instructor')) {
                return this.sendForbidden(res, 'Insufficient permissions');
            }

            // Get basic course statistics
            const totalCourses = await this.courseModel.count();
            const publishedCourses = await this.courseModel.count({ status: 'published' });
            const draftCourses = await this.courseModel.count({ status: 'draft' });
            const featuredCourses = await this.courseModel.count({ is_featured: 1 });

            const stats = {
                total: totalCourses,
                published: publishedCourses,
                draft: draftCourses,
                featured: featuredCourses,
                categories: await this.categoryModel.count({ is_active: 1 })
            };

            this.setCacheHeaders(res, 300);
            return this.sendSuccess(res, stats, 'Course statistics retrieved successfully');

        } catch (error) {
            console.error('Error getting course stats:', error);
            return this.sendError(res, 'Failed to retrieve course statistics');
        }
    });
}

module.exports = CourseController;
