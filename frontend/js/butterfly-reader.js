class ButterflyReader {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            speed: options.speed || 180, // Natural speaking pace
            autoStart: options.autoStart || false,
            showControls: options.showControls !== false,
            showProgress: options.showProgress !== false,
            enableVoice: options.enableVoice !== false,
            voiceRate: options.voiceRate || 1.0,
            voicePitch: options.voicePitch || 1.0,
            voiceVolume: options.voiceVolume || 0.7,
            ...options
        };
        
        this.isPlaying = false;
        this.currentWordIndex = 0;
        this.words = [];
        this.butterfly = null;
        this.progressBar = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.voiceEnabled = false;
        this.availableVoices = [];
        this.selectedVoice = null;
        this.baseDelay = 600; // Slower base delay for natural reading
        this.geminiApiKey = null; // Will be set from input
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        // Add butterfly reader class
        this.container.classList.add('butterfly-reader');
        
        // Initialize speech synthesis
        this.initVoice();
        
        // Parse text into words
        this.parseText();
        
        // Create butterfly
        this.createButterfly();
        
        // Create controls
        if (this.options.showControls) {
            this.createControls();
        }
        
        // Create progress bar
        if (this.options.showProgress) {
            this.createProgressBar();
        }
        
        // Auto start if enabled
        if (this.options.autoStart) {
            this.start();
        }
    }
    
    initVoice() {
        if (!this.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }
        
        // Load voices
        this.loadVoices();
        
        // Listen for voice changes
        this.speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
    }
    
    loadVoices() {
        this.availableVoices = this.speechSynthesis.getVoices();
        
        // Prefer more natural voices (Google, Microsoft, or system voices)
        this.selectedVoice = this.availableVoices.find(voice => 
            voice.name.includes('Google') && voice.lang.startsWith('en')
        ) || this.availableVoices.find(voice => 
            voice.name.includes('Microsoft') && voice.lang.startsWith('en')
        ) || this.availableVoices.find(voice => 
            voice.name.includes('Samantha') || voice.name.includes('Alex')
        ) || this.availableVoices.find(voice => 
            voice.lang.startsWith('en') && voice.localService
        ) || this.availableVoices.find(voice => 
            voice.lang.startsWith('en')
        ) || this.availableVoices[0];
        
        this.voiceEnabled = this.options.enableVoice && this.selectedVoice;
        
        console.log('Selected voice:', this.selectedVoice?.name);
    }
    
    speak(text) {
        if (!this.voiceEnabled || !this.selectedVoice) return;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        // Create new utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.voice = this.selectedVoice;
        this.currentUtterance.rate = this.options.voiceRate;
        this.currentUtterance.pitch = this.options.voicePitch;
        this.currentUtterance.volume = this.options.voiceVolume;
        
        // Speak the text
        this.speechSynthesis.speak(this.currentUtterance);
    }
    
    stopSpeaking() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }
    
    parseText() {
        const textContent = this.container.innerHTML;
        
        // Split into paragraphs
        const paragraphs = textContent.split(/<\/p>|<br\s*\/?>/i);
        let wordIndex = 0;
        
        this.container.innerHTML = '';
        
        paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) return;
            
            const pElement = document.createElement('p');
            pElement.classList.add('paragraph');
            
            // Remove HTML tags and split into sentences
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
                    
                    // Add space after word (except last word in sentence)
                    if (wIndex < words.length - 1) {
                        sentenceSpan.appendChild(document.createTextNode(' '));
                    }
                });
                
                pElement.appendChild(sentenceSpan);
                
                // Add sentence ending punctuation
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
        
        // Position butterfly at first word
        if (this.words.length > 0) {
            this.positionButterfly(0);
        }
    }
    
    createControls() {
        // Remove existing controls
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
        
        // Speed indicator
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
        // Remove previous highlights
        this.words.forEach(word => {
            word.element.classList.remove('reading');
        });
        
        // Highlight current word
        if (this.words[wordIndex]) {
            const currentWord = this.words[wordIndex];
            currentWord.element.classList.add('reading');
            
            // Speak the word if voice is enabled (now async)
            if (this.voiceEnabled) {
                await this.speak(currentWord.text);
            }
            
            // Mark previous words as read
            for (let i = 0; i < wordIndex; i++) {
                this.words[i].element.classList.add('read');
            }
            
            // Check if sentence is completed
            this.checkSentenceCompletion(wordIndex);
            
            // Update progress
            this.updateProgress(wordIndex);
        }
    }
    
    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        
        if (this.voiceBtn) {
            this.voiceBtn.innerHTML = this.voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off';
        }
        
        if (this.speedIndicator) {
            this.speedIndicator.innerHTML = `${this.options.speed} WPM${this.voiceEnabled ? ' 🔊' : ' 🔇'}`;
        }
        
        // Stop current speech if disabling
        if (!this.voiceEnabled) {
            this.stopSpeaking();
        }
    }
    
    checkSentenceCompletion(wordIndex) {
        if (!this.words[wordIndex]) return;
        
        const currentWord = this.words[wordIndex];
        const sentence = currentWord.element.closest('.sentence');
        
        // Check if all words in sentence are read
        const sentenceWords = sentence.querySelectorAll('.word');
        const readWords = sentence.querySelectorAll('.word.read');
        
        if (readWords.length === sentenceWords.length - 1) { // -1 because current word is 'reading'
            sentence.classList.add('completed');
            
            // Check paragraph completion
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
        this.stopSpeaking(); // Stop voice when pausing
        
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
        
        // Calculate natural delay based on word type and context
        const delay = this.calculateNaturalDelay(this.currentWordIndex);
        
        this.currentWordIndex++;
        
        setTimeout(() => {
            this.readNext();
        }, delay);
    }
    
    calculateNaturalDelay(wordIndex) {
        const word = this.words[wordIndex];
        if (!word) return this.baseDelay;
        
        // Simple, consistent timing like the reference code
        const text = word.text.toLowerCase();
        let multiplier = 1.0;
        
        // Only adjust for punctuation (like the reference)
        if (text.includes('.') || text.includes('!') || text.includes('?')) {
            multiplier = 1.5; // Gentle pause
        } else if (text.includes(',')) {
            multiplier = 1.2; // Light pause
        }
        
        // Paragraph breaks
        const nextWord = this.words[wordIndex + 1];
        if (nextWord && this.isNewParagraph(word, nextWord)) {
            multiplier = 2.0; // Paragraph pause
        }
        
        return this.baseDelay * multiplier;
    }
    
    isNewParagraph(currentWord, nextWord) {
        return currentWord.paragraph !== nextWord.paragraph;
    }
    
    async speak(text) {
        if (!this.voiceEnabled) return;
        
        try {
            // Use Gemini TTS API like the reference code
            const audioUrl = await this.generateAudio(text);
            if (audioUrl) {
                await this.playAudio(audioUrl);
            }
        } catch (error) {
            console.error('Error with Gemini TTS, falling back to browser speech:', error);
            this.fallbackSpeak(text);
        }
    }
    
    async generateAudio(text) {
        if (!this.geminiApiKey) {
            throw new Error('Gemini API key not provided');
        }
        
        const payload = {
            contents: [{
                parts: [{ text: text }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Kore" }
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${this.geminiApiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.[0];
            const audioData = part?.inlineData?.data;
            const mimeType = part?.inlineData?.mimeType;

            if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
                const sampleRateMatch = mimeType.match(/rate=(\d+)/);
                if (!sampleRateMatch) {
                    throw new Error("Could not determine sample rate");
                }
                const sampleRate = parseInt(sampleRateMatch[1], 10);
                const pcmData = this.base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmData);
                const wavBlob = this.pcmToWav(pcm16, sampleRate);
                return URL.createObjectURL(wavBlob);
            }
        } catch (error) {
            console.error("Gemini TTS error:", error);
            return null;
        }
    }
    
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    pcmToWav(pcm16, sampleRate) {
        const numChannels = 1;
        const bytesPerSample = 2;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = pcm16.length * bytesPerSample;

        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        this.writeString(view, 8, 'WAVE');

        // fmt sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);

        // data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write PCM data
        for (let i = 0; i < pcm16.length; i++) {
            view.setInt16(44 + i * 2, pcm16[i], true);
        }

        return new Blob([view], { type: 'audio/wav' });
    }
    
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
    
    async playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = (e) => {
                URL.revokeObjectURL(audioUrl);
                reject(e);
            };
            audio.play();
        });
    }
    
    fallbackSpeak(text) {
        // Fallback to browser speech synthesis
        if (!this.selectedVoice) return;
        
        this.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.selectedVoice;
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        this.speechSynthesis.speak(utterance);
    }
    
    changeSpeed() {
        // Slower, more natural timing ranges
        const delays = [900, 750, 600, 500, 400, 350]; // Slower base delays
        const speedNames = ['Very Slow', 'Slow', 'Natural', 'Brisk', 'Fast', 'Quick'];
        
        const currentIndex = delays.indexOf(this.baseDelay);
        const nextIndex = (currentIndex + 1) % delays.length;
        
        // Update the base delay
        this.baseDelay = delays[nextIndex];
        const speedName = speedNames[nextIndex];
        
        if (this.speedIndicator) {
            this.speedIndicator.innerHTML = `${speedName}${this.voiceEnabled ? ' 🔊' : ' 🔇'}`;
        }
    }
    
    reset() {
        this.pause();
        this.currentWordIndex = 0;
        
        // Remove all highlights
        this.words.forEach(word => {
            word.element.classList.remove('reading', 'read');
        });
        
        // Remove sentence and paragraph completion
        this.container.querySelectorAll('.sentence, .paragraph').forEach(el => {
            el.classList.remove('completed');
        });
        
        // Reset butterfly position
        this.positionButterfly(0);
        
        // Reset progress
        this.updateProgress(0);
    }
    
    // Public method to initialize on any element
    static init(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        const readers = [];
        
        elements.forEach(element => {
            readers.push(new ButterflyReader(element, options));
        });
        
        return readers.length === 1 ? readers[0] : readers;
    }
}

// Auto-initialize on story content
document.addEventListener('DOMContentLoaded', function() {
    // Initialize butterfly reader on story content
    const storyContent = document.querySelector('.story-content, .slide-description, .question-card p');
    if (storyContent) {
        window.butterflyReader = new ButterflyReader(storyContent, {
            speed: 200,
            autoStart: false,
            showControls: true,
            showProgress: true
        });
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButterflyReader;
}
