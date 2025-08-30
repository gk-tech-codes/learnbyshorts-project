// Course Player JavaScript

class CoursePlayer {
    constructor() {
        this.currentCourse = null;
        this.currentConceptIndex = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.autoAdvance = true;
        this.showDescriptions = true;
        this.enableQuiz = true;
        this.conceptTimer = null;
        this.conceptDuration = 8; // seconds
        this.currentTime = 0;
        
        this.initializePlayer();
        this.loadCourse();
    }

    initializePlayer() {
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.loadSettings();
    }

    setupEventListeners() {
        // Play/Pause button
        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Previous/Next buttons
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousConcept();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextConcept();
        });

        // Speed control
        document.getElementById('speed-control').addEventListener('click', () => {
            this.cycleSpeed();
        });

        // Settings button
        document.querySelector('.settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        // Progress bar click
        document.querySelector('.concept-progress-bar').addEventListener('click', (e) => {
            this.seekTo(e);
        });

        // Volume control
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        // Quiz options
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-option')) {
                this.selectQuizOption(e.target);
            }
        });

        // Details toggle
        document.getElementById('toggle-details').addEventListener('click', () => {
            this.toggleDetails();
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousConcept();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextConcept();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.increaseSpeed();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.decreaseSpeed();
                    break;
            }
        });
    }

    async loadCourse() {
        try {
            // Get course ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id') || 1;

            // Load course data
            const response = await fetch(`/api/courses/${courseId}`);
            const result = await response.json();

            if (result.success) {
                this.currentCourse = result.data;
                this.renderCourse();
                this.loadConcept(0);
            } else {
                this.showError('Failed to load course');
            }
        } catch (error) {
            console.error('Error loading course:', error);
            this.showError('Failed to load course');
        }
    }

    renderCourse() {
        // Update course title
        document.getElementById('course-title').textContent = this.currentCourse.title;
        document.getElementById('total-concepts').textContent = this.currentCourse.concepts.length;

        // Render concepts list
        this.renderConceptsList();
        
        // Update progress
        this.updateCourseProgress();
    }

    renderConceptsList() {
        const conceptsList = document.getElementById('concepts-list');
        conceptsList.innerHTML = '';

        this.currentCourse.concepts.forEach((concept, index) => {
            const conceptItem = document.createElement('div');
            conceptItem.className = `concept-item ${index === this.currentConceptIndex ? 'active' : ''}`;
            conceptItem.innerHTML = `
                <div class="concept-number">${index + 1}</div>
                <div class="concept-info">
                    <h4>${concept.title}</h4>
                    <p>${concept.description}</p>
                </div>
            `;
            
            conceptItem.addEventListener('click', () => {
                this.loadConcept(index);
            });

            conceptsList.appendChild(conceptItem);
        });
    }

    loadConcept(index) {
        if (index < 0 || index >= this.currentCourse.concepts.length) return;

        this.currentConceptIndex = index;
        const concept = this.currentCourse.concepts[index];
        
        // Update UI
        document.getElementById('current-concept').textContent = index + 1;
        document.getElementById('concept-title').textContent = concept.title;
        document.getElementById('concept-description').textContent = concept.description;
        
        // Load concept images
        this.loadConceptImages(concept);
        
        // Update concept details
        this.updateConceptDetails(concept);
        
        // Update navigation
        this.updateConceptNavigation();
        
        // Reset timer
        this.resetConceptTimer();
        
        // Update progress
        this.updateCourseProgress();
    }

    loadConceptImages(concept) {
        // For now, just load the first image
        // In a full implementation, this would cycle through all images
        const imageElement = document.getElementById('concept-image');
        if (concept.images && concept.images.length > 0) {
            imageElement.src = concept.images[0];
        }
        
        // Set concept duration
        this.conceptDuration = concept.duration || 8;
        document.getElementById('total-time').textContent = this.formatTime(this.conceptDuration);
    }

    updateConceptDetails(concept) {
        // Update detailed explanation
        document.getElementById('detailed-explanation').textContent = 
            concept.detailedExplanation || concept.description;

        // Update key points (mock data for now)
        const keyPointsList = document.getElementById('key-points-list');
        keyPointsList.innerHTML = '';
        const keyPoints = concept.keyPoints || [
            'Key concept point 1',
            'Key concept point 2',
            'Key concept point 3'
        ];
        
        keyPoints.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            keyPointsList.appendChild(li);
        });

        // Update related tags (mock data for now)
        const relatedTags = document.getElementById('related-tags');
        relatedTags.innerHTML = '';
        const tags = concept.relatedConcepts || ['Related Concept 1', 'Related Concept 2'];
        
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            relatedTags.appendChild(span);
        });
    }

    updateConceptNavigation() {
        const conceptItems = document.querySelectorAll('.concept-item');
        conceptItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentConceptIndex);
        });
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        document.getElementById('play-pause-btn').textContent = '⏸️';
        this.startConceptTimer();
    }

    pause() {
        this.isPlaying = false;
        document.getElementById('play-pause-btn').textContent = '▶️';
        this.stopConceptTimer();
    }

    startConceptTimer() {
        this.conceptTimer = setInterval(() => {
            this.currentTime += 0.1;
            this.updateConceptProgress();
            
            if (this.currentTime >= this.conceptDuration) {
                this.onConceptComplete();
            }
        }, 100);
    }

    stopConceptTimer() {
        if (this.conceptTimer) {
            clearInterval(this.conceptTimer);
            this.conceptTimer = null;
        }
    }

    resetConceptTimer() {
        this.stopConceptTimer();
        this.currentTime = 0;
        this.updateConceptProgress();
        this.pause();
    }

    updateConceptProgress() {
        const progress = (this.currentTime / this.conceptDuration) * 100;
        document.getElementById('concept-progress').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('current-time').textContent = this.formatTime(this.currentTime);
    }

    updateCourseProgress() {
        const progress = ((this.currentConceptIndex + 1) / this.currentCourse.concepts.length) * 100;
        document.getElementById('course-progress').style.width = `${progress}%`;
    }

    onConceptComplete() {
        this.pause();
        
        // Mark concept as completed
        const conceptItems = document.querySelectorAll('.concept-item');
        if (conceptItems[this.currentConceptIndex]) {
            conceptItems[this.currentConceptIndex].classList.add('completed');
        }

        // Show quiz if enabled
        if (this.enableQuiz) {
            this.showQuiz();
        } else if (this.autoAdvance) {
            setTimeout(() => {
                this.nextConcept();
            }, 1000);
        }

        // Update progress in backend
        this.updateProgress();
    }

    async updateProgress() {
        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 1, // Mock user ID
                    courseId: this.currentCourse.id,
                    conceptId: this.currentCourse.concepts[this.currentConceptIndex].id,
                    completed: true,
                    timeSpent: Math.round(this.currentTime)
                })
            });
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    previousConcept() {
        if (this.currentConceptIndex > 0) {
            this.loadConcept(this.currentConceptIndex - 1);
        }
    }

    nextConcept() {
        if (this.currentConceptIndex < this.currentCourse.concepts.length - 1) {
            this.loadConcept(this.currentConceptIndex + 1);
        } else {
            this.onCourseComplete();
        }
    }

    onCourseComplete() {
        alert('Congratulations! You have completed the course!');
        // Redirect to course completion page or back to courses
        window.location.href = '/';
    }

    cycleSpeed() {
        const speeds = [0.5, 1, 1.25, 1.5, 2];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        this.playbackSpeed = speeds[nextIndex];
        
        document.getElementById('speed-control').textContent = `${this.playbackSpeed}x`;
    }

    increaseSpeed() {
        const speeds = [0.5, 1, 1.25, 1.5, 2];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        if (currentIndex < speeds.length - 1) {
            this.playbackSpeed = speeds[currentIndex + 1];
            document.getElementById('speed-control').textContent = `${this.playbackSpeed}x`;
        }
    }

    decreaseSpeed() {
        const speeds = [0.5, 1, 1.25, 1.5, 2];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        if (currentIndex > 0) {
            this.playbackSpeed = speeds[currentIndex - 1];
            document.getElementById('speed-control').textContent = `${this.playbackSpeed}x`;
        }
    }

    seekTo(event) {
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        this.currentTime = percentage * this.conceptDuration;
        this.updateConceptProgress();
    }

    setVolume(volume) {
        // Volume control implementation
        console.log('Volume set to:', volume);
    }

    showQuiz() {
        const modal = document.getElementById('quiz-modal');
        modal.style.display = 'block';
        
        // Load quiz question (mock data for now)
        this.loadQuizQuestion();
    }

    loadQuizQuestion() {
        const concept = this.currentCourse.concepts[this.currentConceptIndex];
        
        // Mock quiz data
        const quizData = {
            question: `What is the main concept of "${concept.title}"?`,
            options: [
                { text: concept.description, correct: true },
                { text: 'This is a wrong answer option 1', correct: false },
                { text: 'This is a wrong answer option 2', correct: false },
                { text: 'This is a wrong answer option 3', correct: false }
            ]
        };

        document.getElementById('quiz-question').textContent = quizData.question;
        
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        quizData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'quiz-option';
            button.textContent = option.text;
            button.dataset.correct = option.correct;
            optionsContainer.appendChild(button);
        });
    }

    selectQuizOption(optionElement) {
        // Remove previous selections
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'wrong');
        });

        // Mark selected option
        optionElement.classList.add('selected');
        
        // Show correct/wrong feedback
        const isCorrect = optionElement.dataset.correct === 'true';
        optionElement.classList.add(isCorrect ? 'correct' : 'wrong');
        
        // Show all correct answers
        document.querySelectorAll('.quiz-option').forEach(opt => {
            if (opt.dataset.correct === 'true') {
                opt.classList.add('correct');
            }
        });

        // Show feedback
        const feedback = document.getElementById('quiz-feedback');
        feedback.style.display = 'block';
        feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
        feedback.textContent = isCorrect ? 
            'Correct! Well done.' : 
            'Not quite right. The correct answer is highlighted above.';

        // Enable next button
        document.getElementById('next-concept-btn').disabled = false;
    }

    closeQuiz() {
        document.getElementById('quiz-modal').style.display = 'none';
        
        if (this.autoAdvance) {
            this.nextConcept();
        }
    }

    openSettings() {
        document.getElementById('settings-modal').style.display = 'block';
        this.loadCurrentSettings();
    }

    closeSettings() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    loadCurrentSettings() {
        document.getElementById('speed-select').value = this.playbackSpeed;
        document.getElementById('auto-advance').checked = this.autoAdvance;
        document.getElementById('show-descriptions').checked = this.showDescriptions;
        document.getElementById('enable-quiz').checked = this.enableQuiz;
    }

    saveSettings() {
        this.playbackSpeed = parseFloat(document.getElementById('speed-select').value);
        this.autoAdvance = document.getElementById('auto-advance').checked;
        this.showDescriptions = document.getElementById('show-descriptions').checked;
        this.enableQuiz = document.getElementById('enable-quiz').checked;

        // Update speed display
        document.getElementById('speed-control').textContent = `${this.playbackSpeed}x`;

        // Save to localStorage
        this.saveSettingsToStorage();
        
        this.closeSettings();
    }

    loadSettings() {
        const settings = localStorage.getItem('learnbyshorts-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.playbackSpeed = parsed.playbackSpeed || 1;
            this.autoAdvance = parsed.autoAdvance !== undefined ? parsed.autoAdvance : true;
            this.showDescriptions = parsed.showDescriptions !== undefined ? parsed.showDescriptions : true;
            this.enableQuiz = parsed.enableQuiz !== undefined ? parsed.enableQuiz : true;
        }
    }

    saveSettingsToStorage() {
        const settings = {
            playbackSpeed: this.playbackSpeed,
            autoAdvance: this.autoAdvance,
            showDescriptions: this.showDescriptions,
            enableQuiz: this.enableQuiz
        };
        localStorage.setItem('learnbyshorts-settings', JSON.stringify(settings));
    }

    toggleDetails() {
        const detailsContent = document.getElementById('details-content');
        const toggleBtn = document.getElementById('toggle-details');
        
        if (detailsContent.style.display === 'none') {
            detailsContent.style.display = 'block';
            toggleBtn.textContent = '📖';
        } else {
            detailsContent.style.display = 'none';
            toggleBtn.textContent = '📕';
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showError(message) {
        alert(`Error: ${message}`);
    }
}

// Global functions for HTML onclick handlers
function goBack() {
    window.history.back();
}

function closeQuiz() {
    if (window.player) {
        window.player.closeQuiz();
    }
}

function nextConcept() {
    if (window.player) {
        window.player.nextConcept();
    }
}

function closeSettings() {
    if (window.player) {
        window.player.closeSettings();
    }
}

function saveSettings() {
    if (window.player) {
        window.player.saveSettings();
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.player = new CoursePlayer();
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const quizModal = document.getElementById('quiz-modal');
    const settingsModal = document.getElementById('settings-modal');
    
    if (event.target === quizModal) {
        quizModal.style.display = 'none';
    }
    
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});
