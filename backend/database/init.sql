-- LearnByShorts Database Schema
-- Complete database initialization with all tables and relationships

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    bio TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    is_active BOOLEAN DEFAULT 1,
    is_locked BOOLEAN DEFAULT 0,
    locked_until DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT 0,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires DATETIME,
    preferences TEXT, -- JSON
    timezone TEXT DEFAULT 'UTC',
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (hierarchical)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id TEXT,
    icon_url TEXT,
    color TEXT,
    is_featured BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- in minutes
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    metadata TEXT, -- JSON - includes creator info
    schedule_config TEXT, -- JSON - default schedule configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Course schedules table (configurable schedules)
CREATE TABLE IF NOT EXISTS course_schedules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    course_id TEXT NOT NULL,
    schedule_name TEXT NOT NULL,
    schedule_type TEXT DEFAULT 'linear' CHECK (schedule_type IN ('linear', 'adaptive', 'flexible', 'deadline')),
    schedule_config TEXT NOT NULL, -- JSON configuration
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, schedule_name)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- JSON - lesson content including images, text, etc.
    duration INTEGER, -- in seconds
    order_index INTEGER DEFAULT 0,
    lesson_type TEXT DEFAULT 'image_sequence' CHECK (lesson_type IN ('image_sequence', 'video', 'text', 'quiz', 'interactive')),
    resources TEXT, -- JSON - additional resources
    prerequisites TEXT, -- JSON - prerequisite lesson IDs
    learning_objectives TEXT, -- JSON - learning objectives
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    lesson_id TEXT,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    progress_percentage REAL DEFAULT 0.0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    score REAL,
    last_accessed DATETIME,
    completion_date DATETIME,
    metadata TEXT, -- JSON - additional progress data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id, lesson_id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login attempts table (for rate limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL,
    ip_address TEXT,
    success BOOLEAN DEFAULT 0,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Course templates table
CREATE TABLE IF NOT EXISTS course_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    template_data TEXT NOT NULL, -- JSON - course structure template
    default_schedule TEXT, -- JSON - default schedule configuration
    is_active BOOLEAN DEFAULT 1,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    schedule_id TEXT,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_date DATETIME,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'paused')),
    progress_percentage REAL DEFAULT 0.0,
    metadata TEXT, -- JSON
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES course_schedules(id) ON DELETE SET NULL,
    UNIQUE(user_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(is_featured);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);

CREATE INDEX IF NOT EXISTS idx_course_schedules_course ON course_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_schedules_active ON course_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(status);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
    AFTER UPDATE ON categories
    BEGIN
        UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_courses_timestamp 
    AFTER UPDATE ON courses
    BEGIN
        UPDATE courses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_course_schedules_timestamp 
    AFTER UPDATE ON course_schedules
    BEGIN
        UPDATE course_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_lessons_timestamp 
    AFTER UPDATE ON lessons
    BEGIN
        UPDATE lessons SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_progress_timestamp 
    AFTER UPDATE ON user_progress
    BEGIN
        UPDATE user_progress SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_templates_timestamp 
    AFTER UPDATE ON course_templates
    BEGIN
        UPDATE course_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description, is_featured, order_index) VALUES
('cat-programming', 'Programming', 'Learn programming languages and software development', 1, 1),
('cat-design', 'Design', 'UI/UX design, graphic design, and visual arts', 1, 2),
('cat-business', 'Business', 'Business skills, entrepreneurship, and management', 1, 3),
('cat-languages', 'Languages', 'Learn new languages and improve communication skills', 1, 4),
('cat-science', 'Science', 'Mathematics, physics, chemistry, and natural sciences', 0, 5),
('cat-arts', 'Arts & Crafts', 'Creative arts, music, and hands-on crafts', 0, 6);

-- Insert subcategories
INSERT OR IGNORE INTO categories (id, name, description, parent_id, order_index) VALUES
('cat-web-dev', 'Web Development', 'HTML, CSS, JavaScript, and web frameworks', 'cat-programming', 1),
('cat-mobile-dev', 'Mobile Development', 'iOS, Android, and cross-platform development', 'cat-programming', 2),
('cat-data-science', 'Data Science', 'Python, R, machine learning, and analytics', 'cat-programming', 3),
('cat-ui-design', 'UI Design', 'User interface design and prototyping', 'cat-design', 1),
('cat-ux-design', 'UX Design', 'User experience research and design', 'cat-design', 2),
('cat-marketing', 'Marketing', 'Digital marketing, SEO, and social media', 'cat-business', 1),
('cat-finance', 'Finance', 'Personal finance, investing, and accounting', 'cat-business', 2);

-- Insert sample course templates
INSERT OR IGNORE INTO course_templates (id, name, description, category_id, template_data, default_schedule) VALUES
('template-web-basics', 'Web Development Basics Template', 'Template for basic web development courses', 'cat-web-dev', 
'{"lessons": [{"title": "Introduction to HTML", "duration": 300}, {"title": "CSS Fundamentals", "duration": 400}, {"title": "JavaScript Basics", "duration": 500}]}',
'{"type": "linear", "duration_weeks": 4, "lessons_per_week": 2}'),
('template-design-intro', 'Design Introduction Template', 'Template for introductory design courses', 'cat-ui-design',
'{"lessons": [{"title": "Design Principles", "duration": 250}, {"title": "Color Theory", "duration": 300}, {"title": "Typography", "duration": 350}]}',
'{"type": "flexible", "duration_weeks": 3, "lessons_per_week": 3}');

-- Create admin user (password: Admin123!)
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified) VALUES
('admin-user-001', 'admin@learnbyshorts.com', '$2b$10$rQZ8kHWfQxwjQxDjQxDjQOQxDjQxDjQxDjQxDjQxDjQxDjQxDjQxDj', 'Admin', 'User', 'admin', 1, 1);

-- Cleanup old sessions (remove expired sessions)
DELETE FROM user_sessions WHERE expires_at < datetime('now');

-- Cleanup old login attempts (remove attempts older than 24 hours)
DELETE FROM login_attempts WHERE attempted_at < datetime('now', '-1 day');
