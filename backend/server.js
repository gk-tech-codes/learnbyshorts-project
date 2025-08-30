/**
 * LearnByShorts Server - Main application server with MVC architecture
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Import middleware
const { sanitizeRequest } = require('./middleware/validation');
const { apiRateLimit } = require('./middleware/rateLimit');
const { optionalAuth } = require('./middleware/auth');

// Initialize database
const BaseModel = require('./models/BaseModel');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your production domain
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Basic middleware
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeRequest);

// Rate limiting
app.use('/api/', apiRateLimit);

// Optional authentication for all routes
app.use(optionalAuth);

// Request logging middleware
app.use((req, res, next) => {
    if (NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            user: req.user?.email || 'anonymous'
        });
    }
    next();
});

// Initialize database on startup
const initializeDatabase = async () => {
    try {
        const baseModel = new BaseModel();
        await baseModel.initializeDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'LearnByShorts API is running',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'LearnByShorts API',
        version: '1.0.0',
        description: 'Educational platform API with configurable course schedules',
        endpoints: {
            users: {
                'POST /api/users/register': 'User registration',
                'POST /api/users/login': 'User login',
                'GET /api/users/profile': 'Get user profile',
                'PUT /api/users/profile': 'Update user profile',
                'GET /api/users/progress': 'Get user progress',
                'PUT /api/users/progress/:courseId/:lessonId': 'Update lesson progress'
            },
            courses: {
                'GET /api/courses': 'Get all courses',
                'GET /api/courses/:id': 'Get course by ID',
                'POST /api/courses': 'Create new course (Instructor+)',
                'PUT /api/courses/:id': 'Update course (Instructor+)',
                'GET /api/courses/:id/schedules': 'Get course schedules',
                'POST /api/courses/:id/schedules': 'Create course schedule (Instructor+)'
            },
            categories: {
                'GET /api/categories': 'Get all categories',
                'GET /api/categories/:id': 'Get category by ID',
                'POST /api/categories': 'Create category (Admin)',
                'PUT /api/categories/:id': 'Update category (Admin)'
            }
        }
    });
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
}));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes that don't exist
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Don't leak error details in production
    const message = NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;
    
    res.status(error.status || 500).json({
        success: false,
        message,
        ...(NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Graceful shutdown
const gracefulShutdown = (signal, server) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    if (server) {
        server.close(() => {
            console.log('HTTP server closed');
            
            // Close database connections
            const baseModel = new BaseModel();
            baseModel.closeDatabase().then(() => {
                console.log('Database connections closed');
                process.exit(0);
            }).catch((error) => {
                console.error('Error closing database:', error);
                process.exit(1);
            });
        });
    } else {
        console.log('No server instance to close');
        process.exit(0);
    }
    
    // Force close after 30 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Start server
const startServer = async () => {
    try {
        // Initialize database first
        await initializeDatabase();
        
        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log(`
🚀 LearnByShorts Server Started Successfully!
📍 Environment: ${NODE_ENV}
🌐 Server: http://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/api/docs
💚 Health Check: http://localhost:${PORT}/api/health
            `);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
        process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
        
        return server;
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Export for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}
