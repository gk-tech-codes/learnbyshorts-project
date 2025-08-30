class ButterflyReader {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            speed: options.speed || 180,
            autoStart: options.autoStart || false,
            showControls: options.showControls !== false,
            showProgress: options.showProgress !== false,
            enableVoice: options.enableVoice !== false,
            selectedVoice: options.selectedVoice || null,
            ...options
        };
        
        this.isPlaying = false;
        this.currentWordIndex = 0;
        this.words = [];
        this.butterfly = null;
        this.progressBar = null;
        this.voiceEnabled = false;
        this.selectedVoice = this.options.selectedVoice;
        this.baseDelay = 700; // Slightly slower for better sync with speech
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        this.container.classList.add('butterfly-reader');
        this.parseText();
        this.createButterfly();
        
        if (this.options.showControls) {
            this.createControls();
        }
        
        if (this.options.showProgress) {
            this.createProgressBar();
        }
        
        this.voiceEnabled = this.options.enableVoice && 'speechSynthesis' in window;
        
        if (this.options.autoStart) {
            this.start();
        }
    }
    
    parseText() {
        const textContent = this.container.innerHTML;
        const paragraphs = textContent.split(/<\/p>|<br\s*\/?>/i);
        let wordIndex = 0;
        
        this.container.innerHTML = '';
        
        paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) return;
            
            const pElement = document.createElement('p');
            pElement.classList.add('paragraph');
            
            const cleanText = paragraph.replace(/<[^>]*>/g, '');
            const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim());
            
            sentences.forEach((sentence, sIndex) => {
                const sentenceSpan = document.createElement('span');
                sentenceSpan.classList.add('sentence');
                
                const words = sentence.trim().split(/\s+/).filter(w => w);
                
                words.forEach((word, wIndex) => {
                    const wordSpan = document.createElement('span');
                    wordSpan.classList.add('word');
                    wordSpan.textContent = word;
                    wordSpan.dataset.index = wordIndex++;
                    
                    this.words.push({
                        element: wordSpan,
                        text: word,
                        paragraph: pIndex,
                        sentence: sIndex
                    });
                    
                    sentenceSpan.appendChild(wordSpan);
                    
                    if (wIndex < words.length - 1) {
                        sentenceSpan.appendChild(document.createTextNode(' '));
                    }
                });
                
                pElement.appendChild(sentenceSpan);
                
                if (sIndex < sentences.length - 1) {
                    pElement.appendChild(document.createTextNode('. '));
                }
            });
            
            this.container.appendChild(pElement);
        });
    }
    
    createButterfly() {
        this.butterfly = document.createElement('div');
        this.butterfly.classList.add('butterfly');
        this.container.appendChild(this.butterfly);
        
        if (this.words.length > 0) {
            this.positionButterfly(0);
        }
    }
    
    createControls() {
        const existingControls = document.querySelector('.butterfly-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const controls = document.createElement('div');
        controls.classList.add('butterfly-controls');
        
        const playBtn = document.createElement('button');
        playBtn.classList.add('butterfly-btn');
        playBtn.innerHTML = '▶️ Start Reading';
        playBtn.onclick = () => this.toggleReading();
        
        const voiceBtn = document.createElement('button');
        voiceBtn.classList.add('butterfly-btn');
        voiceBtn.innerHTML = this.voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off';
        voiceBtn.onclick = () => this.toggleVoice();
        
        const speedBtn = document.createElement('button');
        speedBtn.classList.add('butterfly-btn');
        speedBtn.innerHTML = '⚡ Speed';
        speedBtn.onclick = () => this.changeSpeed();
        
        const resetBtn = document.createElement('button');
        resetBtn.classList.add('butterfly-btn');
        resetBtn.innerHTML = '🔄 Reset';
        resetBtn.onclick = () => this.reset();
        
        controls.appendChild(playBtn);
        controls.appendChild(voiceBtn);
        controls.appendChild(speedBtn);
        controls.appendChild(resetBtn);
        
        document.body.appendChild(controls);
        
        const speedIndicator = document.createElement('div');
        speedIndicator.classList.add('speed-indicator');
        speedIndicator.innerHTML = `Natural${this.voiceEnabled ? ' 🔊' : ' 🔇'}`;
        document.body.appendChild(speedIndicator);
        
        this.playBtn = playBtn;
        this.voiceBtn = voiceBtn;
        this.speedIndicator = speedIndicator;
    }
    
    createProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.classList.add('reading-progress');
        document.body.appendChild(this.progressBar);
    }
    
    positionButterfly(wordIndex) {
        if (!this.words[wordIndex] || !this.butterfly) return;
        
        const wordElement = this.words[wordIndex].element;
        const rect = wordElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const x = rect.left - containerRect.left - 10;
        const y = rect.top - containerRect.top - 5;
        
        this.butterfly.style.left = `${x}px`;
        this.butterfly.style.top = `${y}px`;
    }
    
    async highlightWord(wordIndex) {
        this.words.forEach(word => {
            word.element.classList.remove('reading');
        });
        
        if (this.words[wordIndex]) {
            const currentWord = this.words[wordIndex];
            currentWord.element.classList.add('reading');
            
            // Speak with optimized browser TTS
            if (this.voiceEnabled) {
                await this.speak(currentWord.text);
            }
            
            for (let i = 0; i < wordIndex; i++) {
                this.words[i].element.classList.add('read');
            }
            
            this.checkSentenceCompletion(wordIndex);
            this.updateProgress(wordIndex);
        }
    }
    
    async speak(text) {
        if (!this.voiceEnabled || !this.selectedVoice) return;
        
        return new Promise((resolve) => {
            speechSynthesis.cancel(); // Stop any ongoing speech
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.selectedVoice;
            
            // Optimized settings for natural sound
            utterance.rate = 0.85;  // Slightly slower for clarity
            utterance.pitch = 1.0;  // Natural pitch
            utterance.volume = 1.0; // Full volume
            
            // Add slight variation for more natural sound
            if (text.includes('?')) {
                utterance.pitch = 1.1; // Slight rise for questions
            } else if (text.includes('!')) {
                utterance.rate = 0.9;  // Slightly slower for emphasis
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve(); // Continue even if speech fails
            
            speechSynthesis.speak(utterance);
        });
    }
    
    setVoice(voice) {
        this.selectedVoice = voice;
        console.log('Voice changed to:', voice.name);
    }
    
    checkSentenceCompletion(wordIndex) {
        if (!this.words[wordIndex]) return;
        
        const currentWord = this.words[wordIndex];
        const sentence = currentWord.element.closest('.sentence');
        
        const sentenceWords = sentence.querySelectorAll('.word');
        const readWords = sentence.querySelectorAll('.word.read');
        
        if (readWords.length === sentenceWords.length - 1) {
            sentence.classList.add('completed');
            
            const paragraph = sentence.closest('.paragraph');
            const paragraphSentences = paragraph.querySelectorAll('.sentence');
            const completedSentences = paragraph.querySelectorAll('.sentence.completed');
            
            if (completedSentences.length === paragraphSentences.length - 1) {
                setTimeout(() => {
                    paragraph.classList.add('completed');
                }, 500);
            }
        }
    }
    
    updateProgress(wordIndex) {
        if (this.progressBar) {
            const progress = (wordIndex / this.words.length) * 100;
            this.progressBar.style.width = `${progress}%`;
        }
    }
    
    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        if (this.playBtn) {
            this.playBtn.innerHTML = '⏸️ Pause';
            this.playBtn.classList.add('playing');
        }
        
        this.readNext();
    }
    
    pause() {
        this.isPlaying = false;
        speechSynthesis.cancel(); // Stop speech
        
        if (this.playBtn) {
            this.playBtn.innerHTML = '▶️ Continue';
            this.playBtn.classList.remove('playing');
        }
    }
    
    toggleReading() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.start();
        }
    }
    
    async readNext() {
        if (!this.isPlaying || this.currentWordIndex >= this.words.length) {
            this.pause();
            return;
        }
        
        this.positionButterfly(this.currentWordIndex);
        await this.highlightWord(this.currentWordIndex);
        
        const delay = this.calculateNaturalDelay(this.currentWordIndex);
        
        this.currentWordIndex++;
        
        setTimeout(() => {
            this.readNext();
        }, delay);
    }
    
    calculateNaturalDelay(wordIndex) {
        const word = this.words[wordIndex];
        if (!word) return this.baseDelay;
        
        const text = word.text.toLowerCase();
        let multiplier = 1.0;
        
        if (text.includes('.') || text.includes('!') || text.includes('?')) {
            multiplier = 1.4; // Gentle pause for punctuation
        } else if (text.includes(',')) {
            multiplier = 1.2; // Light pause for commas
        }
        
        const nextWord = this.words[wordIndex + 1];
        if (nextWord && this.isNewParagraph(word, nextWord)) {
            multiplier = 1.8; // Paragraph pause
        }
        
        return this.baseDelay * multiplier;
    }
    
    isNewParagraph(currentWord, nextWord) {
        return currentWord.paragraph !== nextWord.paragraph;
    }
    
    changeSpeed() {
        const delays = [900, 750, 700, 600, 500, 400];
        const speedNames = ['Very Slow', 'Slow', 'Natural', 'Brisk', 'Fast', 'Quick'];
        
        const currentIndex = delays.indexOf(this.baseDelay);
        const nextIndex = (currentIndex + 1) % delays.length;
        
        this.baseDelay = delays[nextIndex];
        const speedName = speedNames[nextIndex];
        
        if (this.speedIndicator) {
            this.speedIndicator.innerHTML = `${speedName}${this.voiceEnabled ? ' 🔊' : ' 🔇'}`;
        }
    }
    
    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        
        if (this.voiceBtn) {
            this.voiceBtn.innerHTML = this.voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off';
        }
        
        if (this.speedIndicator) {
            this.speedIndicator.innerHTML = this.speedIndicator.innerHTML.replace(/🔊|🔇/, this.voiceEnabled ? '🔊' : '🔇');
        }
        
        if (!this.voiceEnabled) {
            speechSynthesis.cancel();
        }
    }
    
    reset() {
        this.pause();
        this.currentWordIndex = 0;
        
        this.words.forEach(word => {
            word.element.classList.remove('reading', 'read');
        });
        
        this.container.querySelectorAll('.sentence, .paragraph').forEach(el => {
            el.classList.remove('completed');
        });
        
        this.positionButterfly(0);
        this.updateProgress(0);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButterflyReader;
}
