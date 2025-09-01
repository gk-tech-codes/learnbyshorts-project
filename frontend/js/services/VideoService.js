/**
 * Video Service - Manages video content and streaming
 */
class VideoService {
    constructor() {
        this.videoBucket = 'learnbyshorts-videos-464994449735';
        this.cdnUrl = `https://${this.videoBucket}.s3.amazonaws.com`;
        this.videoConfig = null;
        
        // Load video configuration
        this.loadVideoConfig();
        
        this.previewVideos = [
            {
                id: 'intro-data-structures',
                title: 'Introduction to Data Structures',
                description: 'Learn the fundamentals of arrays, linked lists, and stacks through engaging visual stories.',
                course: 'Data Structures',
                duration: '5:30',
                thumbnail: `${this.cdnUrl}/thumbnails/data-structures-intro.jpg`,
                videoUrl: `${this.cdnUrl}/previews/data-structures-intro.mp4`,
                level: 'Beginner'
            },
            {
                id: 'binary-search-story',
                title: 'Binary Search Adventure',
                description: 'Follow a detective story to understand how binary search works in real-world scenarios.',
                course: 'Algorithms',
                duration: '4:15',
                thumbnail: `${this.cdnUrl}/thumbnails/binary-search.jpg`,
                videoUrl: `${this.cdnUrl}/previews/binary-search.mp4`,
                level: 'Intermediate'
            },
            {
                id: 'system-design-basics',
                title: 'System Design Fundamentals',
                description: 'Build a social media platform step-by-step and learn scalability concepts.',
                course: 'System Design',
                duration: '8:45',
                thumbnail: `${this.cdnUrl}/thumbnails/system-design.jpg`,
                videoUrl: `${this.cdnUrl}/previews/system-design.mp4`,
                level: 'Advanced'
            }
        ];
    }

    async loadVideoConfig() {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/data/youtube-videos.json', true);
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            this.videoConfig = JSON.parse(xhr.responseText);
                            console.log('✅ Video config loaded:', this.videoConfig.videos.length, 'videos');
                            resolve(this.videoConfig);
                        } else {
                            console.error('❌ Failed to load video config:', xhr.status);
                            this.videoConfig = { videos: [], config: {} };
                            resolve(this.videoConfig);
                        }
                    }
                };
                xhr.onerror = () => {
                    console.error('❌ Failed to load video config: Network error');
                    this.videoConfig = { videos: [], config: {} };
                    resolve(this.videoConfig);
                };
                xhr.send();
            } catch (error) {
                console.error('❌ Failed to load video config:', error);
                this.videoConfig = { videos: [], config: {} };
                resolve(this.videoConfig);
            }
        });
    }

    getPopularVideos() {
        if (!this.videoConfig || !this.videoConfig.videos) {
            return [];
        }
        
        return this.videoConfig.videos.map(video => ({
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description,
            author: video.author,
            duration: video.duration,
            thumbnail: video.thumbnail || this.videoConfig.config.fallbackThumbnail?.replace('{videoId}', video.youtubeId),
            videoUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
            category: video.category,
            level: video.level,
            views: video.views,
            featured: video.featured,
            isYouTube: true,
            tags: video.tags || []
        }));
    }



    createVideoTile(videoData) {
        const utmParams = this.videoConfig?.config?.enableAnalytics ? 
            `&utm_source=${this.videoConfig.config.utmSource}&utm_medium=${this.videoConfig.config.utmMedium}&utm_campaign=${this.videoConfig.config.utmCampaign}&utm_content=${videoData.id}` : '';
        
        const videoElement = videoData.isYouTube ? 
            `<iframe 
                class="tile-video youtube-embed" 
                src="${videoData.videoUrl}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&fs=1&cc_load_policy=1&iv_load_policy=3&controls=1&showinfo=0&theme=dark&color=white${utmParams}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen
                title="${videoData.title}"
                loading="lazy">
            </iframe>` :
            `<video class="tile-video" preload="metadata" muted controls>
                <source src="${videoData.videoUrl}" type="video/mp4">
            </video>`;

        return `
            <div class="video-tile" data-video-id="${videoData.id}" data-is-youtube="${videoData.isYouTube || false}">
                <div class="video-thumbnail">
                    ${videoElement}
                    ${!videoData.isYouTube ? `
                        <div class="play-overlay">
                            <div class="play-icon">
                                <svg viewBox="0 0 24 24">
                                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>
                    ` : ''}
                    ${videoData.duration ? `<div class="duration-badge">${videoData.duration}</div>` : ''}
                    <button class="expand-button" title="Expand to full screen" aria-label="Expand video">⛶</button>
                </div>
                <div class="video-tile-info">
                    <h3 class="video-tile-title">${videoData.title}</h3>
                    <p class="video-tile-description">${videoData.description}</p>
                    <div class="video-meta">
                        ${videoData.category ? `<span class="course-badge">${videoData.category}</span>` : ''}
                        ${videoData.level ? `<span class="level level-${videoData.level.toLowerCase()}">${videoData.level}</span>` : ''}
                        ${videoData.views ? `<span class="views">${videoData.views} views</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async createVideoSlider(container) {
        // Show loading state
        container.innerHTML = '<div class="loading-state">Loading videos...</div>';
        
        try {
            // Wait for config to load if not already loaded
            if (!this.videoConfig) {
                await this.loadVideoConfig();
            }
            
            const popularVideos = this.getPopularVideos();
            
            if (popularVideos.length === 0) {
                container.innerHTML = '<div class="error-state">No videos configured</div>';
                return;
            }
            
            const videoTiles = popularVideos.map(video => this.createVideoTile(video)).join('');
            
            // Create slider with navigation
            container.innerHTML = `
                <button class="slider-nav prev" onclick="videoSlider.scrollPrev()">‹</button>
                <button class="slider-nav next" onclick="videoSlider.scrollNext()">›</button>
                <div class="video-slider" id="video-slider">
                    ${videoTiles}
                </div>
                <div class="auto-scroll-indicator">
                    ${popularVideos.map((_, i) => `<div class="scroll-dot ${i === 0 ? 'active' : ''}" onclick="videoSlider.scrollToIndex(${i})"></div>`).join('')}
                </div>
            `;
            
            // Initialize slider functionality
            this.initializeSlider();
            
            // Add event listeners after creating tiles
            this.addVideoEventListeners();
        } catch (error) {
            console.error('Failed to load videos:', error);
            container.innerHTML = '<div class="error-state">Failed to load videos</div>';
        }
    }

    initializeSlider() {
        const slider = document.getElementById('video-slider');
        const dots = document.querySelectorAll('.scroll-dot');
        const prevBtn = document.querySelector('.slider-nav.prev');
        const nextBtn = document.querySelector('.slider-nav.next');
        
        let currentIndex = 0;
        let autoScrollInterval = null;
        
        // Auto-scroll functionality
        const startAutoScroll = () => {
            if (autoScrollInterval) clearInterval(autoScrollInterval);
            autoScrollInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % dots.length;
                scrollToIndex(currentIndex);
            }, 5000); // Change every 5 seconds
        };
        
        const scrollToIndex = (index) => {
            const scrollAmount = index * 320; // 300px width + 20px gap
            slider.scrollTo({ left: scrollAmount, behavior: 'smooth' });
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            // Update navigation buttons
            prevBtn.disabled = index === 0;
            nextBtn.disabled = index === dots.length - 1;
            
            currentIndex = index;
        };
        
        // Global slider controls
        window.videoSlider = {
            scrollPrev: () => {
                if (currentIndex > 0) {
                    scrollToIndex(currentIndex - 1);
                }
            },
            scrollNext: () => {
                if (currentIndex < dots.length - 1) {
                    scrollToIndex(currentIndex + 1);
                }
            },
            scrollToIndex: scrollToIndex
        };
        
        // Start auto-scroll
        startAutoScroll();
        
        // Pause auto-scroll on hover
        slider.addEventListener('mouseenter', () => {
            clearInterval(autoScrollInterval);
        });
        
        slider.addEventListener('mouseleave', () => {
            startAutoScroll();
        });
        
        // Initialize first state
        scrollToIndex(0);
    }

    addVideoEventListeners() {
        console.log('🔧 Adding video event listeners...');
        
        document.querySelectorAll('.video-tile').forEach(tile => {
            const videoId = tile.dataset.videoId;
            const isYouTube = tile.dataset.isYoutube === 'true';
            const expandBtn = tile.querySelector('.expand-button');
            
            console.log('🎥 Setting up tile:', videoId, isYouTube ? '(YouTube)' : '(Native)');
            
            if (!isYouTube) {
                // Handle native video tiles
                const video = tile.querySelector('.tile-video');
                const overlay = tile.querySelector('.play-overlay');
                
                // Play video when overlay is clicked
                overlay?.addEventListener('click', (e) => {
                    console.log('🎯 Overlay clicked for:', videoId);
                    e.preventDefault();
                    e.stopPropagation();
                    this.playTileVideo(videoId);
                });
                
                // Play video when video element is clicked
                video?.addEventListener('click', (e) => {
                    console.log('🎯 Video clicked for:', videoId);
                    e.preventDefault();
                    e.stopPropagation();
                    if (video.paused) {
                        this.playTileVideo(videoId);
                    } else {
                        video.pause();
                    }
                });
            } else {
                // Handle YouTube videos - track interactions
                const iframe = tile.querySelector('.youtube-embed');
                iframe?.addEventListener('load', () => {
                    console.log('📺 YouTube video loaded:', videoId);
                    // Track YouTube video load
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'video_load', {
                            'video_id': videoId,
                            'video_title': tile.querySelector('.video-tile-title')?.textContent,
                            'source': 'homepage_tile',
                            'platform': 'youtube'
                        });
                    }
                });
            }
            
            // Expand button click for both types
            expandBtn?.addEventListener('click', (e) => {
                console.log('🎯 Expand clicked for:', videoId);
                e.preventDefault();
                e.stopPropagation();
                this.openVideoModal(videoId);
                
                // Track expand button click
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'video_expand', {
                        'video_id': videoId,
                        'source': 'homepage_tile',
                        'platform': isYouTube ? 'youtube' : 'native'
                    });
                }
            });
        });
        
        console.log('✅ Event listeners added to', document.querySelectorAll('.video-tile').length, 'tiles');
    }

    playTileVideo(videoId) {
        console.log('🎬 Attempting to play video:', videoId);
        
        const tile = document.querySelector(`[data-video-id="${videoId}"]`);
        if (!tile) {
            console.error('❌ Tile not found for:', videoId);
            return;
        }
        
        const video = tile.querySelector('.tile-video');
        const overlay = tile.querySelector('.play-overlay');
        const expandBtn = tile.querySelector('.expand-button');
        
        if (!video) {
            console.error('❌ Video element not found');
            return;
        }
        
        console.log('🎬 Video element found, attempting play...');
        
        // Unmute video when user explicitly clicks play
        video.muted = false;
        video.volume = 0.8; // Set to 80% volume
        
        // Try to load the video first
        if (video.readyState === 0) {
            console.log('🔄 Loading video...');
            video.load();
        }
        
        // Play video inline
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ Video playing successfully with sound:', videoId);
                overlay.classList.add('hidden');
                expandBtn.classList.add('visible');
            }).catch(e => {
                console.error('❌ Play failed:', e);
                
                // If unmuted play fails, try muted first then unmute
                video.muted = true;
                video.play().then(() => {
                    console.log('✅ Playing muted, will unmute after start');
                    // Unmute after a short delay
                    setTimeout(() => {
                        video.muted = false;
                        video.volume = 0.8;
                        console.log('🔊 Video unmuted');
                    }, 500);
                    overlay.classList.add('hidden');
                    expandBtn.classList.add('visible');
                }).catch(retryError => {
                    console.error('❌ Even muted play failed:', retryError);
                    alert('Video failed to play: ' + retryError.message);
                });
            });
        }
        
        // Show expand button when video ends
        video.addEventListener('ended', () => {
            console.log('🏁 Video ended:', videoId);
            overlay.classList.remove('hidden');
            expandBtn.classList.remove('visible');
            video.muted = true; // Mute again for next play
        });
        
        // Show overlay when video is paused
        video.addEventListener('pause', () => {
            console.log('⏸️ Video paused:', videoId);
            if (!video.ended) {
                overlay.classList.remove('hidden');
                expandBtn.classList.remove('visible');
            }
        });
    }

    createVideoModal() {
        const modalHTML = `
            <div id="video-modal" class="video-modal">
                <div class="video-modal-content">
                    <button class="modal-close" onclick="closeVideoModal()">&times;</button>
                    <div class="video-modal-player">
                        <video id="modal-video" controls preload="metadata">
                            <source id="modal-video-source" src="" type="video/mp4">
                        </video>
                    </div>
                    <div class="video-modal-info">
                        <h2 id="modal-title" class="video-modal-title"></h2>
                        <p id="modal-description" class="video-modal-description"></p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close modal on background click
        document.getElementById('video-modal').addEventListener('click', (e) => {
            if (e.target.id === 'video-modal') {
                closeVideoModal();
            }
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeVideoModal();
            }
        });
    }

    getVideoUrl(course, topic, filename) {
        return `${this.cdnUrl}/courses/${course}/${topic}/${filename}`;
    }

    getThumbnailUrl(filename) {
        return `${this.cdnUrl}/thumbnails/${filename}`;
    }

    createVideoPlayer(container, videoData, isPopular = false) {
        const viewsDisplay = videoData.views ? `<span class="views">${videoData.views} views</span>` : '';
        const popularBadge = isPopular ? '<div class="popular-badge">🔥 Popular</div>' : '';
        
        const playerHTML = `
            <div class="video-player ${isPopular ? 'popular-video' : ''}" data-video-id="${videoData.id}">
                <div class="video-container">
                    <video 
                        class="video-element"
                        poster="${videoData.thumbnail}"
                        preload="metadata"
                        controls
                        playsinline
                    >
                        <source src="${videoData.videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-overlay">
                        <button class="play-button">
                            <svg width="60" height="60" viewBox="0 0 60 60">
                                <circle cx="30" cy="30" r="30" fill="rgba(79, 70, 229, 0.9)"/>
                                <polygon points="23,18 23,42 42,30" fill="white"/>
                            </svg>
                        </button>
                    </div>
                    ${popularBadge}
                </div>
                <div class="video-info">
                    <h3 class="video-title">${videoData.title}</h3>
                    <p class="video-description">${videoData.description}</p>
                    <div class="video-meta">
                        <span class="course-badge">${videoData.course}</span>
                        <span class="duration">${videoData.duration}</span>
                        ${viewsDisplay}
                        <span class="level level-${videoData.level.toLowerCase()}">${videoData.level}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = playerHTML;
        this.initializePlayer(container.querySelector('.video-player'));
    }

    initializePlayer(playerElement) {
        const video = playerElement.querySelector('.video-element');
        const overlay = playerElement.querySelector('.video-overlay');
        const playButton = playerElement.querySelector('.play-button');

        // Play button click
        playButton.addEventListener('click', () => {
            video.play();
            overlay.style.display = 'none';
        });

        // Video events
        video.addEventListener('play', () => {
            overlay.style.display = 'none';
        });

        video.addEventListener('pause', () => {
            overlay.style.display = 'flex';
        });

        video.addEventListener('ended', () => {
            overlay.style.display = 'flex';
        });

        // Optimize for mobile
        video.addEventListener('loadstart', () => {
            if (window.innerWidth <= 768) {
                video.setAttribute('controls', 'true');
            }
        });
    }

    async openVideoModal(videoId) {
        const videos = this.getPopularVideos();
        const video = videos.find(v => v.id === videoId);
        
        if (!video) return;
        
        const modal = document.getElementById('video-modal');
        const modalContent = modal.querySelector('.video-modal-player');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');
        
        // Update modal content
        modalTitle.textContent = video.title;
        modalDescription.textContent = video.description;
        
        // Create appropriate video element
        if (video.isYouTube) {
            const youtubeUrl = `${video.videoUrl}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1&playsinline=1&fs=1&cc_load_policy=1&iv_load_policy=3&controls=1&showinfo=0&theme=dark&color=white&utm_source=learnbyshorts&utm_medium=homepage&utm_campaign=video_modal&utm_content=${video.id}`;
            
            modalContent.innerHTML = `
                <iframe 
                    id="modal-video" 
                    class="youtube-modal-embed"
                    src="${youtubeUrl}"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    title="${video.title}"
                    width="100%" 
                    height="100%">
                </iframe>
            `;
            
            // Track YouTube modal open
            if (typeof gtag !== 'undefined') {
                gtag('event', 'video_modal_open', {
                    'video_id': videoId,
                    'video_title': video.title,
                    'source': 'homepage_modal',
                    'platform': 'youtube'
                });
            }
        } else {
            modalContent.innerHTML = `
                <video id="modal-video" controls preload="metadata" width="100%" height="100%">
                    <source id="modal-video-source" src="${video.videoUrl}" type="video/mp4">
                </video>
            `;
            
            const modalVideo = document.getElementById('modal-video');
            modalVideo.volume = 0.8;
            modalVideo.play().catch(e => console.log('Auto-play prevented:', e));
        }
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('🎬 Modal opened for:', videoId, video.isYouTube ? '(YouTube)' : '(Native)');
    }
}

// Global video functions
function openVideoModal(videoId) {
    if (window.videoService) {
        window.videoService.openVideoModal(videoId);
    }
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const modalContent = modal.querySelector('.video-modal-player');
    
    // Hide modal
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear modal content to stop any playing videos
    modalContent.innerHTML = '';
    
    // Track modal close
    if (typeof gtag !== 'undefined') {
        gtag('event', 'video_modal_close', {
            'source': 'homepage_modal'
        });
    }
    
    console.log('🚪 Modal closed, content cleared');
}

// Initialize video service
window.videoService = new VideoService();
