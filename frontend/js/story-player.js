// Story-based Course Player JavaScript

class StoryPlayer {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 6;
        this.isAutoPlay = false;
        this.autoPlayInterval = null;
        this.slideTimer = 8000; // 8 seconds per slide
        
        this.quizData = [
            {
                question: "What is the main problem that Singleton pattern solves?",
                options: [
                    "Ensures only one instance of a class exists",
                    "Makes classes run faster",
                    "Reduces memory usage",
                    "Improves code readability"
                ],
                correct: 0,
                explanation: "Singleton pattern ensures that only one instance of a class exists throughout the application lifecycle."
            },
            {
                question: "How do you get an instance of a Singleton class?",
                options: [
                    "new ClassName()",
                    "ClassName.getInstance()",
                    "ClassName.create()",
                    "ClassName.newInstance()"
                ],
                correct: 1,
                explanation: "Singleton classes provide a static getInstance() method to access the single instance."
            },
            {
                question: "Why does Singleton have a private constructor?",
                options: [
                    "To save memory",
                    "To improve performance",
                    "To prevent direct instantiation",
                    "To make it thread-safe"
                ],
                correct: 2,
                explanation: "Private constructor prevents external code from creating new instances directly."
            },
            {
                question: "Which of these is a good use case for Singleton?",
                options: [
                    "User objects in a social media app",
                    "Product items in an e-commerce site",
                    "Logger for application-wide logging",
                    "Individual customer orders"
                ],
                correct: 2,
                explanation: "Logger is perfect for Singleton as you want one centralized logging system throughout the app."
            },
            {
                question: "What happens if you try to clone a Singleton object?",
                options: [
                    "It creates a new instance",
                    "It should be prevented/throw an error",
                    "It returns null",
                    "It works normally"
                ],
                correct: 1,
                explanation: "Proper Singleton implementation prevents cloning to maintain the single instance guarantee."
            },
            {
                question: "What is the key benefit of using Singleton pattern?",
                options: [
                    "Faster execution",
                    "Less code to write",
                    "Global access to a single instance",
                    "Better user interface"
                ],
                correct: 2,
                explanation: "Singleton provides global access to a single, consistent instance throughout the application."
            }
        ];
        
        this.initializePlayer();
    }

    initializePlayer() {
        this.setupEventListeners();
        this.createDots();
        this.updateProgress();
        this.showSlide(0);
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousSlide();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextSlide();
        });

        // Auto-play toggle
        document.getElementById('autoPlayBtn').addEventListener('click', () => {
            this.toggleAutoPlay();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggleAutoPlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.stopAutoPlay();
                    break;
            }
        });

        // Quiz modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-option')) {
                this.selectQuizOption(e.target);
            }
        });
    }

    createDots() {
        const dotsContainer = document.getElementById('conceptDots');
        dotsContainer.innerHTML = '';

        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.setAttribute('data-slide', i);
            dot.addEventListener('click', () => this.showSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    showSlide(index) {
        if (index < 0 || index >= this.totalSlides) return;

        this.currentSlide = index;
        const offset = -this.currentSlide * 100;
        document.getElementById('slidesWrapper').style.transform = `translateX(${offset}%)`;

        this.updateDots();
        this.updateProgress();
        this.updateNavigationButtons();
        this.updateConceptCounter();

        // Show quiz after certain slides (except the last one)
        if (this.shouldShowQuiz(index)) {
            setTimeout(() => {
                this.showQuiz(index);
            }, 1000);
        }

        // Track progress
        this.trackProgress(index);
    }

    shouldShowQuiz(slideIndex) {
        // Show quiz after slides 1, 2, 3, 4 (not intro or lesson summary)
        return slideIndex > 0 && slideIndex < 5;
    }

    updateDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
            dot.classList.toggle('completed', index < this.currentSlide);
        });
    }

    updateProgress() {
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentSlide === 0;
        nextBtn.disabled = this.currentSlide === this.totalSlides - 1;

        // Update button text for last slide
        if (this.currentSlide === this.totalSlides - 1) {
            nextBtn.innerHTML = '<span class="nav-text">Complete</span><span class="nav-icon">✓</span>';
        } else {
            nextBtn.innerHTML = '<span class="nav-text">Next</span><span class="nav-icon">→</span>';
        }
    }

    updateConceptCounter() {
        document.getElementById('currentConcept').textContent = this.currentSlide + 1;
        document.getElementById('totalConcepts').textContent = this.totalSlides;
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.showSlide(this.currentSlide + 1);
        } else {
            this.completeCourse();
        }
    }

    previousSlide() {
        if (this.currentSlide > 0) {
            this.showSlide(this.currentSlide - 1);
        }
    }

    toggleAutoPlay() {
        if (this.isAutoPlay) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.isAutoPlay = true;
        document.getElementById('autoPlayBtn').textContent = 'Pause';
        document.getElementById('autoPlayBtn').style.background = 'rgba(239, 68, 68, 0.2)';
        
        this.autoPlayInterval = setInterval(() => {
            if (this.currentSlide < this.totalSlides - 1) {
                this.nextSlide();
            } else {
                this.stopAutoPlay();
            }
        }, this.slideTimer);
    }

    stopAutoPlay() {
        this.isAutoPlay = false;
        document.getElementById('autoPlayBtn').textContent = 'Auto Play';
        document.getElementById('autoPlayBtn').style.background = 'rgba(255, 255, 255, 0.1)';
        
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    showQuiz(slideIndex) {
        const quiz = this.quizData[slideIndex - 1]; // Adjust for 0-based index
        if (!quiz) return;

        const modal = document.getElementById('quizModal');
        const questionEl = document.getElementById('quizQuestion');
        const optionsEl = document.getElementById('quizOptions');
        const feedbackEl = document.getElementById('quizFeedback');

        questionEl.textContent = quiz.question;
        optionsEl.innerHTML = '';
        feedbackEl.innerHTML = '';
        feedbackEl.style.display = 'none';

        quiz.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'quiz-option';
            button.textContent = option;
            button.dataset.index = index;
            button.dataset.correct = index === quiz.correct;
            optionsEl.appendChild(button);
        });

        modal.style.display = 'block';
        document.getElementById('nextConceptBtn').disabled = true;

        // Pause auto-play during quiz
        if (this.isAutoPlay) {
            this.stopAutoPlay();
        }
    }

    selectQuizOption(optionElement) {
        const options = document.querySelectorAll('.quiz-option');
        const feedbackEl = document.getElementById('quizFeedback');
        const isCorrect = optionElement.dataset.correct === 'true';
        const slideIndex = this.currentSlide;
        const quiz = this.quizData[slideIndex - 1];

        // Remove previous selections
        options.forEach(opt => {
            opt.classList.remove('selected', 'correct', 'wrong');
        });

        // Mark selected option
        optionElement.classList.add('selected');
        optionElement.classList.add(isCorrect ? 'correct' : 'wrong');

        // Show correct answer
        options.forEach(opt => {
            if (opt.dataset.correct === 'true') {
                opt.classList.add('correct');
            }
        });

        // Show feedback
        feedbackEl.style.display = 'block';
        feedbackEl.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
        feedbackEl.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.5rem;">
                ${isCorrect ? '✅ Correct!' : '❌ Not quite right.'}
            </div>
            <div>${quiz.explanation}</div>
        `;

        // Enable continue button
        document.getElementById('nextConceptBtn').disabled = false;

        // Track quiz result
        this.trackQuizResult(slideIndex, isCorrect);
    }

    closeQuiz() {
        document.getElementById('quizModal').style.display = 'none';
    }

    nextConcept() {
        this.closeQuiz();
        this.nextSlide();
    }

    completeCourse() {
        // Show completion message
        this.showCompletionMessage();
        
        // Track course completion
        this.trackCourseCompletion();
    }

    showCompletionMessage() {
        const message = `
            <div style="text-align: center; padding: 2rem;">
                <h2 style="color: #10b981; margin-bottom: 1rem;">🎉 Congratulations!</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">
                    You've successfully completed the Singleton Design Pattern course!
                </p>
                <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <h3 style="color: #166534; margin-bottom: 1rem;">What you've learned:</h3>
                    <ul style="text-align: left; color: #166534; line-height: 1.8;">
                        <li>✅ Why Singleton pattern is needed</li>
                        <li>✅ How to implement getInstance() method</li>
                        <li>✅ Protection against cloning and reflection</li>
                        <li>✅ Global access benefits</li>
                        <li>✅ Real-world use cases</li>
                        <li>✅ Implementation best practices</li>
                    </ul>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.href='/'" style="background: #6366f1; color: white; padding: 1rem 2rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Explore More Courses
                    </button>
                    <button onclick="window.location.reload()" style="background: #10b981; color: white; padding: 1rem 2rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Review Course
                    </button>
                </div>
            </div>
        `;

        // Replace the current slide content
        const currentSlideEl = document.querySelector('.slide[data-concept="6"]');
        if (currentSlideEl) {
            currentSlideEl.innerHTML = message;
        }
    }

    async trackProgress(slideIndex) {
        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 1, // Mock user ID
                    courseId: 'singleton-pattern',
                    conceptId: slideIndex + 1,
                    completed: true,
                    timeSpent: 8 // Average time per slide
                })
            });
        } catch (error) {
            console.error('Error tracking progress:', error);
        }
    }

    async trackQuizResult(slideIndex, isCorrect) {
        try {
            await fetch('/api/progress/quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 1,
                    courseId: 'singleton-pattern',
                    conceptId: slideIndex + 1,
                    quizResult: isCorrect,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error tracking quiz result:', error);
        }
    }

    async trackCourseCompletion() {
        try {
            await fetch('/api/progress/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 1,
                    courseId: 'singleton-pattern',
                    completedAt: new Date().toISOString(),
                    totalTimeSpent: this.slideTimer * this.totalSlides / 1000
                })
            });
        } catch (error) {
            console.error('Error tracking course completion:', error);
        }
    }
}

// Global functions for HTML onclick handlers
function goBack() {
    window.history.back();
}

function closeQuiz() {
    if (window.storyPlayer) {
        window.storyPlayer.closeQuiz();
    }
}

function nextConcept() {
    if (window.storyPlayer) {
        window.storyPlayer.nextConcept();
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.storyPlayer = new StoryPlayer();
    
    // Add some visual enhancements
    addVisualEnhancements();
});

function addVisualEnhancements() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe story elements for animation
    const animateElements = document.querySelectorAll('.dialogue, .code-block, .benefit, .use-case');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const quizModal = document.getElementById('quizModal');
    
    if (event.target === quizModal) {
        quizModal.style.display = 'none';
    }
});

// Add touch support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && window.storyPlayer) {
            // Swipe left - next slide
            window.storyPlayer.nextSlide();
        } else if (diff < 0 && window.storyPlayer) {
            // Swipe right - previous slide
            window.storyPlayer.previousSlide();
        }
    }
}
