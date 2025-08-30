class ButterflyReader {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            speed: options.speed || 180,
            autoStart: options.autoStart || false,
            showControls: options.showControls !== false,
            showProgress: options.showProgress !== false,
            enableVoice: options.enableVoice !== false,
            voiceType: options.voiceType || 'free',
            ...options
        };
        
        this.isPlaying = false;
        this.currentWordIndex = 0;
        this.words = [];
        this.butterfly = null;
        this.progressBar = null;
        this.voiceEnabled = false;
        this.baseDelay = 600;
        
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
        
        // Check if ResponsiveVoice is available
        this.voiceEnabled = this.options.enableVoice && typeof responsiveVoice !== 'undefined';
        
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
            
            // Speak with ResponsiveVoice (free and natural)
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
        if (!this.voiceEnabled || typeof responsiveVoice === 'undefined') return;
        
        return new Promise((resolve) => {
            // Ensure ResponsiveVoice is ready and test audio first
            if (!responsiveVoice.voiceSupport()) {
                console.warn('ResponsiveVoice not supported, falling back to browser TTS');
                this.fallbackSpeak(text);
                resolve();
                return;
            }
            
            // ResponsiveVoice.js - Free natural voices
            responsiveVoice.speak(text, "US English Female", {
                rate: 0.8,        // Slower for clarity
                pitch: 1,         // Natural pitch
                volume: 1,        // Full volume
                onstart: () => console.log('Speaking:', text),
                onend: () => {
                    console.log('Finished speaking:', text);
                    resolve();
                },
                onerror: (error) => {
                    console.error('Speech error:', error);
                    this.fallbackSpeak(text);
                    resolve();
                }
            });
        });
    }
    
    fallbackSpeak(text) {
        // Fallback to browser speech synthesis
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        }
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
        
        // Stop ResponsiveVoice
        if (typeof responsiveVoice !== 'undefined') {
            responsiveVoice.cancel();
        }
        
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
            multiplier = 1.5;
        } else if (text.includes(',')) {
            multiplier = 1.2;
        }
        
        const nextWord = this.words[wordIndex + 1];
        if (nextWord && this.isNewParagraph(word, nextWord)) {
            multiplier = 2.0;
        }
        
        return this.baseDelay * multiplier;
    }
    
    isNewParagraph(currentWord, nextWord) {
        return currentWord.paragraph !== nextWord.paragraph;
    }
    
    changeSpeed() {
        const delays = [900, 750, 600, 500, 400, 350];
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
        
        if (!this.voiceEnabled && typeof responsiveVoice !== 'undefined') {
            responsiveVoice.cancel();
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
    
    static init(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        const readers = [];
        
        elements.forEach(element => {
            readers.push(new ButterflyReader(element, options));
        });
        
        return readers.length === 1 ? readers[0] : readers;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButterflyReader;
}
