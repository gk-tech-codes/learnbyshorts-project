/**
 * Course Model - Handles course data and configurable schedules
 */

const BaseModel = require('./BaseModel');
const crypto = require('crypto');

class Course extends BaseModel {
    constructor() {
        super();
        this.tableName = 'courses';
        this.primaryKey = 'id';
    }

    /**
     * Create courses table
     */
    createTables() {
        const createCoursesTable = `
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                category_id TEXT NOT NULL,
                difficulty_level TEXT DEFAULT 'beginner',
                estimated_duration INTEGER DEFAULT 0,
                thumbnail_url TEXT,
                status TEXT DEFAULT 'draft',
                is_featured BOOLEAN DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                metadata TEXT,
                schedule_config TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `;

        const createLessonsTable = `
            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                duration INTEGER DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                lesson_type TEXT DEFAULT 'visual',
                resources TEXT,
                prerequisites TEXT,
                learning_objectives TEXT,
                status TEXT DEFAULT 'draft',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `;

        const createCourseSchedulesTable = `
            CREATE TABLE IF NOT EXISTS course_schedules (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                schedule_name TEXT NOT NULL,
                schedule_type TEXT DEFAULT 'linear',
                schedule_config TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `;

        const createCourseTemplatesTable = `
            CREATE TABLE IF NOT EXISTS course_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                template_config TEXT NOT NULL,
                category TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.execute(createCoursesTable);
        this.execute(createLessonsTable);
        this.execute(createCourseSchedulesTable);
        this.execute(createCourseTemplatesTable);
    }

    /**
     * Generate unique course ID
     */
    generateId() {
        return crypto.randomUUID();
    }

    /**
     * Create course with schedule configuration
     */
    async createCourse(courseData) {
        const validation = this.validate(courseData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const sanitizedData = this.sanitize(courseData);
        sanitizedData.id = this.generateId();
        
        // Handle schedule configuration
        if (sanitizedData.schedule_config && typeof sanitizedData.schedule_config === 'object') {
            sanitizedData.schedule_config = JSON.stringify(sanitizedData.schedule_config);
        }

        // Handle metadata
        if (sanitizedData.metadata && typeof sanitizedData.metadata === 'object') {
            sanitizedData.metadata = JSON.stringify(sanitizedData.metadata);
        }

        const course = await this.create(sanitizedData);
        
        // Create default schedule if provided
        if (courseData.defaultSchedule) {
            await this.createCourseSchedule(course.id, courseData.defaultSchedule);
        }

        return course;
    }

    /**
     * Get course with full details including lessons and schedules
     */
    async getCourseDetails(courseId) {
        const course = await this.findById(courseId);
        if (!course) return null;

        // Parse JSON fields
        if (course.metadata) {
            course.metadata = JSON.parse(course.metadata);
        }
        if (course.schedule_config) {
            course.schedule_config = JSON.parse(course.schedule_config);
        }

        // Get lessons
        course.lessons = await this.getLessonsByCourse(courseId);
        
        // Get schedules
        course.schedules = await this.getCourseSchedules(courseId);

        return course;
    }

    /**
     * Get lessons for a course
     */
    async getLessonsByCourse(courseId) {
        const sql = `
            SELECT * FROM lessons 
            WHERE course_id = ? 
            ORDER BY order_index ASC, created_at ASC
        `;
        const lessons = await this.query(sql, [courseId]);
        
        return lessons.map(lesson => {
            // Parse JSON fields
            if (lesson.resources) lesson.resources = JSON.parse(lesson.resources);
            if (lesson.prerequisites) lesson.prerequisites = JSON.parse(lesson.prerequisites);
            if (lesson.learning_objectives) lesson.learning_objectives = JSON.parse(lesson.learning_objectives);
            return lesson;
        });
    }

    /**
     * Create course schedule
     */
    async createCourseSchedule(courseId, scheduleData) {
        const scheduleId = this.generateId();
        const schedule = {
            id: scheduleId,
            course_id: courseId,
            schedule_name: scheduleData.name || 'Default Schedule',
            schedule_type: scheduleData.type || 'linear',
            schedule_config: JSON.stringify(scheduleData.config || {}),
            is_active: scheduleData.is_active !== undefined ? scheduleData.is_active : true
        };

        const sql = `
            INSERT INTO course_schedules (id, course_id, schedule_name, schedule_type, schedule_config, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const now = new Date().toISOString();
        await this.execute(sql, [
            schedule.id,
            schedule.course_id,
            schedule.schedule_name,
            schedule.schedule_type,
            schedule.schedule_config,
            schedule.is_active,
            now,
            now
        ]);

        return schedule;
    }

    /**
     * Get course schedules
     */
    async getCourseSchedules(courseId) {
        const sql = `
            SELECT * FROM course_schedules 
            WHERE course_id = ? 
            ORDER BY created_at ASC
        `;
        const schedules = await this.query(sql, [courseId]);
        
        return schedules.map(schedule => {
            schedule.schedule_config = JSON.parse(schedule.schedule_config);
            return schedule;
        });
    }

    /**
     * Update course schedule
     */
    async updateCourseSchedule(scheduleId, scheduleData) {
        const updates = { ...scheduleData };
        if (updates.schedule_config && typeof updates.schedule_config === 'object') {
            updates.schedule_config = JSON.stringify(updates.schedule_config);
        }
        updates.updated_at = new Date().toISOString();

        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(', ');
        const sql = `UPDATE course_schedules SET ${setClause} WHERE id = ?`;
        
        await this.execute(sql, [...Object.values(updates), scheduleId]);
        return await this.getCourseScheduleById(scheduleId);
    }

    /**
     * Get course schedule by ID
     */
    async getCourseScheduleById(scheduleId) {
        const sql = `SELECT * FROM course_schedules WHERE id = ?`;
        const schedule = await this.queryOne(sql, [scheduleId]);
        if (schedule && schedule.schedule_config) {
            schedule.schedule_config = JSON.parse(schedule.schedule_config);
        }
        return schedule;
    }

    /**
     * Create course from template
     */
    async createFromTemplate(templateId, courseData) {
        const template = await this.getCourseTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const templateConfig = JSON.parse(template.template_config);
        
        // Merge template configuration with provided data
        const mergedData = {
            ...templateConfig.defaultCourse,
            ...courseData,
            metadata: {
                ...templateConfig.defaultCourse.metadata,
                ...courseData.metadata,
                template_id: templateId,
                created_from_template: true
            }
        };

        const course = await this.createCourse(mergedData);

        // Create lessons from template
        if (templateConfig.defaultLessons) {
            for (const lessonTemplate of templateConfig.defaultLessons) {
                await this.createLesson(course.id, lessonTemplate);
            }
        }

        return course;
    }

    /**
     * Get course template
     */
    async getCourseTemplate(templateId) {
        const sql = `SELECT * FROM course_templates WHERE id = ? AND is_active = 1`;
        return await this.queryOne(sql, [templateId]);
    }

    /**
     * Get all course templates
     */
    async getCourseTemplates(category = null) {
        let sql = `SELECT * FROM course_templates WHERE is_active = 1`;
        const params = [];

        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY name ASC`;
        return await this.query(sql, params);
    }

    /**
     * Create lesson
     */
    async createLesson(courseId, lessonData) {
        const lessonId = this.generateId();
        const lesson = {
            id: lessonId,
            course_id: courseId,
            title: lessonData.title,
            description: lessonData.description || '',
            content: lessonData.content || '',
            duration: lessonData.duration || 0,
            order_index: lessonData.order_index || 0,
            lesson_type: lessonData.lesson_type || 'visual',
            resources: JSON.stringify(lessonData.resources || []),
            prerequisites: JSON.stringify(lessonData.prerequisites || []),
            learning_objectives: JSON.stringify(lessonData.learning_objectives || []),
            status: lessonData.status || 'draft'
        };

        const sql = `
            INSERT INTO lessons (id, course_id, title, description, content, duration, order_index, lesson_type, resources, prerequisites, learning_objectives, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const now = new Date().toISOString();
        await this.execute(sql, [
            lesson.id,
            lesson.course_id,
            lesson.title,
            lesson.description,
            lesson.content,
            lesson.duration,
            lesson.order_index,
            lesson.lesson_type,
            lesson.resources,
            lesson.prerequisites,
            lesson.learning_objectives,
            lesson.status,
            now,
            now
        ]);

        return lesson;
    }

    /**
     * Get courses by category with pagination
     */
    async getCoursesByCategory(categoryId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const sql = `
            SELECT * FROM courses 
            WHERE category_id = ? AND status = 'published'
            ORDER BY is_featured DESC, order_index ASC, created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const courses = await this.query(sql, [categoryId, limit, offset]);
        const total = await this.count({ category_id: categoryId, status: 'published' });

        return {
            courses: courses.map(course => {
                if (course.metadata) course.metadata = JSON.parse(course.metadata);
                if (course.schedule_config) course.schedule_config = JSON.parse(course.schedule_config);
                return course;
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get featured courses
     */
    async getFeaturedCourses(limit = 6) {
        const sql = `
            SELECT * FROM courses 
            WHERE is_featured = 1 AND status = 'published'
            ORDER BY order_index ASC, created_at DESC
            LIMIT ?
        `;
        
        const courses = await this.query(sql, [limit]);
        return courses.map(course => {
            if (course.metadata) course.metadata = JSON.parse(course.metadata);
            if (course.schedule_config) course.schedule_config = JSON.parse(course.schedule_config);
            return course;
        });
    }

    /**
     * Search courses
     */
    async searchCourses(query, filters = {}) {
        let sql = `
            SELECT * FROM courses 
            WHERE status = 'published' AND (
                title LIKE ? OR 
                description LIKE ?
            )
        `;
        const params = [`%${query}%`, `%${query}%`];

        // Add filters
        if (filters.category_id) {
            sql += ` AND category_id = ?`;
            params.push(filters.category_id);
        }

        if (filters.difficulty_level) {
            sql += ` AND difficulty_level = ?`;
            params.push(filters.difficulty_level);
        }

        sql += ` ORDER BY is_featured DESC, title ASC`;

        if (filters.limit) {
            sql += ` LIMIT ?`;
            params.push(filters.limit);
        }

        const courses = await this.query(sql, params);
        return courses.map(course => {
            if (course.metadata) course.metadata = JSON.parse(course.metadata);
            if (course.schedule_config) course.schedule_config = JSON.parse(course.schedule_config);
            return course;
        });
    }

    /**
     * Validate course data
     */
    validate(data) {
        const errors = [];

        if (!data.title || data.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!data.category_id || data.category_id.trim().length === 0) {
            errors.push('Category ID is required');
        }

        if (data.difficulty_level && !['beginner', 'intermediate', 'advanced'].includes(data.difficulty_level)) {
            errors.push('Invalid difficulty level');
        }

        if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
            errors.push('Invalid status');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize course data
     */
    sanitize(data) {
        const sanitized = { ...data };

        // Trim strings
        if (sanitized.title) sanitized.title = sanitized.title.trim();
        if (sanitized.description) sanitized.description = sanitized.description.trim();
        if (sanitized.category_id) sanitized.category_id = sanitized.category_id.trim();

        // Convert boolean values
        if (sanitized.is_featured !== undefined) {
            sanitized.is_featured = Boolean(sanitized.is_featured);
        }

        // Ensure numeric values
        if (sanitized.estimated_duration) {
            sanitized.estimated_duration = parseInt(sanitized.estimated_duration) || 0;
        }
        if (sanitized.order_index) {
            sanitized.order_index = parseInt(sanitized.order_index) || 0;
        }

        return sanitized;
    }
}

module.exports = Course;
