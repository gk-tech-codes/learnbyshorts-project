const express = require('express');
const router = express.Router();

// Design Patterns Courses - LearnByShorts
const mockCourses = [
    {
        id: 1,
        title: "Singleton Design Pattern",
        description: "Master the Singleton pattern through Sharma Ji's hilarious coding saga",
        category: "design-patterns",
        difficulty: "intermediate",
        rating: 4.9,
        conceptCount: 6,
        thumbnail: "assets/courses/singleton-pattern.jpg",
        type: "story",
        storyUrl: "/singleton-timeline.html",
        concepts: [
            {
                id: 1,
                title: "Too Many Sharmas",
                description: "The problem of multiple instances in a startup office",
                duration: 8,
                tags: ["Problem Introduction", "Multiple Instances"]
            },
            {
                id: 2,
                title: "The One and Only Sharma Ji",
                description: "Understanding getInstance() and single instance concept",
                duration: 8,
                tags: ["getInstance()", "Single Instance"]
            },
            {
                id: 3,
                title: "The Desi Clone Attack",
                description: "Protection against cloning and reflection attacks",
                duration: 8,
                tags: ["Private Constructor", "Clone Protection"]
            },
            {
                id: 4,
                title: "Calling Sharma Ji from Anywhere",
                description: "Global access and consistency across the application",
                duration: 8,
                tags: ["Global Access", "Consistency"]
            },
            {
                id: 5,
                title: "Why Not More Sharma Jis?",
                description: "Understanding the design rationale and problem prevention",
                duration: 8,
                tags: ["Design Rationale", "Problem Prevention"]
            },
            {
                id: 6,
                title: "The Singleton Pattern",
                description: "Key takeaways and implementation best practices",
                duration: 8,
                tags: ["Key Takeaways", "Implementation"]
            }
        ],
        learningOutcomes: [
            "Understand when and why to use Singleton pattern",
            "Implement thread-safe Singleton classes",
            "Prevent cloning and reflection attacks",
            "Identify real-world use cases for Singleton",
            "Apply best practices in Singleton implementation"
        ],
        prerequisites: [
            "Basic understanding of Object-Oriented Programming",
            "Familiarity with Java or similar programming language",
            "Understanding of class constructors and static methods"
        ]
    }
];

const categories = [
    { id: 'design-patterns', name: 'Design Patterns', icon: '🏗️', courseCount: 1, description: 'Master software design patterns through engaging stories' },
    { id: 'creational-patterns', name: 'Creational Patterns', icon: '🏭', courseCount: 0, description: 'Patterns for object creation mechanisms' },
    { id: 'structural-patterns', name: 'Structural Patterns', icon: '🔗', courseCount: 0, description: 'Patterns for object composition and relationships' },
    { id: 'behavioral-patterns', name: 'Behavioral Patterns', icon: '⚡', courseCount: 0, description: 'Patterns for communication between objects' }
];

// GET /api/courses - Get all courses or filter by category
router.get('/', (req, res) => {
    try {
        const { category, difficulty, search } = req.query;
        let filteredCourses = [...mockCourses];

        // Filter by category
        if (category) {
            filteredCourses = filteredCourses.filter(course => 
                course.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Filter by difficulty
        if (difficulty) {
            filteredCourses = filteredCourses.filter(course => 
                course.difficulty.toLowerCase() === difficulty.toLowerCase()
            );
        }

        // Search filter
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredCourses = filteredCourses.filter(course => 
                course.title.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm)
            );
        }

        res.json({
            success: true,
            data: filteredCourses,
            total: filteredCourses.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch courses',
            message: error.message
        });
    }
});

// GET /api/courses/categories - Get all categories
router.get('/categories', (req, res) => {
    try {
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// GET /api/courses/:id - Get specific course by ID
router.get('/:id', (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const course = mockCourses.find(c => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course',
            message: error.message
        });
    }
});

// GET /api/courses/:id/concepts - Get concepts for a specific course
router.get('/:id/concepts', (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const course = mockCourses.find(c => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: course.concepts || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch concepts',
            message: error.message
        });
    }
});

// GET /api/courses/:courseId/concepts/:conceptId - Get specific concept
router.get('/:courseId/concepts/:conceptId', (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const conceptId = parseInt(req.params.conceptId);
        
        const course = mockCourses.find(c => c.id === courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        const concept = course.concepts.find(c => c.id === conceptId);
        if (!concept) {
            return res.status(404).json({
                success: false,
                error: 'Concept not found'
            });
        }

        res.json({
            success: true,
            data: concept
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch concept',
            message: error.message
        });
    }
});

// GET /api/courses/featured - Get featured courses
router.get('/featured', (req, res) => {
    try {
        // Return top-rated courses as featured
        const featuredCourses = mockCourses
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        res.json({
            success: true,
            data: featuredCourses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured courses',
            message: error.message
        });
    }
});

module.exports = router;
