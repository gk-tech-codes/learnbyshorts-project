/**
 * Video Service - Manages video content and streaming
 */
class VideoService {
    constructor() {
        this.videoBucket = 'learnbyshorts-videos-464994449735';
        this.cdnUrl = `https://${this.videoBucket}.s3.amazonaws.com`;
        
        // Popular videos section
        this.popularVideos = [
            {
                id: 'singleton-pattern',
                title: 'Singleton Pattern: Taming Chaos',
                description: 'Master the Singleton design pattern through an engaging story that shows how to control chaos in your code architecture.',
                course: 'Design Patterns',
                duration: '6:42',
                thumbnail: `${this.cdnUrl}/thumbnails/singleton-pattern.jpg`,
                videoUrl: `${this.cdnUrl}/previews/singleton-pattern.mp4`,
                level: 'Intermediate',
                views: '12.5K',
                featured: true
            }
        ];
        
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

    getPopularVideos() {
        return this.popularVideos;
    }

    createVideoTile(videoData) {
        return `
            <div class="video-tile" data-video-id="${videoData.id}">
                <div class="video-thumbnail">
                    <video class="tile-video" preload="metadata" muted controls>
                        <source src="${videoData.videoUrl}" type="video/mp4">
                    </video>
                    <div class="play-overlay">
                        <div class="play-icon">
                            <svg viewBox="0 0 24 24">
                                <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                    <div class="duration-badge">${videoData.duration}</div>
                    <button class="expand-button" title="Expand">⛶</button>
                </div>
                <div class="video-tile-info">
                    <h3 class="video-tile-title">${videoData.title}</h3>
                    <p class="video-tile-description">${videoData.description}</p>
                </div>
            </div>
        `;
    }

    createVideoSlider(container) {
        const popularVideos = this.getPopularVideos();
        
        const sliderHTML = `
            <div class="video-slider">
                ${popularVideos.map(video => this.createVideoTile(video)).join('')}
            </div>
        `;
        
        container.innerHTML = sliderHTML;
        
        // Add event listeners after creating tiles
        this.addVideoEventListeners();
    }

    addVideoEventListeners() {
        console.log('🔧 Adding video event listeners...');
        
        document.querySelectorAll('.video-tile').forEach(tile => {
            const videoId = tile.dataset.videoId;
            const video = tile.querySelector('.tile-video');
            const overlay = tile.querySelector('.play-overlay');
            const expandBtn = tile.querySelector('.expand-button');
            
            console.log('🎥 Setting up tile:', videoId);
            
            // Play video when overlay is clicked
            overlay.addEventListener('click', (e) => {
                console.log('🎯 Overlay clicked for:', videoId);
                e.preventDefault();
                e.stopPropagation();
                this.playTileVideo(videoId);
            });
            
            // Play video when video element is clicked
            video.addEventListener('click', (e) => {
                console.log('🎯 Video clicked for:', videoId);
                e.preventDefault();
                e.stopPropagation();
                if (video.paused) {
                    this.playTileVideo(videoId);
                } else {
                    video.pause();
                }
            });
            
            // Expand button click
            expandBtn.addEventListener('click', (e) => {
                console.log('🎯 Expand clicked for:', videoId);
                e.preventDefault();
                e.stopPropagation();
                openVideoModal(videoId);
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
}

// Global video functions
function openVideoModal(videoId) {
    const videoService = window.videoService;
    const video = videoService.getPopularVideos().find(v => v.id === videoId);
    
    if (!video) return;
    
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const modalVideoSource = document.getElementById('modal-video-source');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    
    // Get current time from tile video and pause it
    const tile = document.querySelector(`[data-video-id="${videoId}"]`);
    const tileVideo = tile.querySelector('.tile-video');
    const currentTime = tileVideo.currentTime || 0;
    const wasPlaying = !tileVideo.paused;
    
    // Pause tile video to prevent double audio
    tileVideo.pause();
    console.log('⏸️ Paused tile video at:', currentTime);
    
    // Update modal content
    modalVideoSource.src = video.videoUrl;
    modalVideo.load();
    modalTitle.textContent = video.title;
    modalDescription.textContent = video.description;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Continue from where tile video left off
    modalVideo.addEventListener('loadedmetadata', () => {
        modalVideo.currentTime = currentTime;
        modalVideo.volume = 0.8; // Set volume for modal
        if (wasPlaying) {
            modalVideo.play().catch(e => console.log('Auto-play prevented:', e));
        }
        console.log('🎬 Modal video ready at:', currentTime);
    }, { once: true });
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    
    // Hide modal
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Pause and reset modal video
    modalVideo.pause();
    modalVideo.currentTime = 0;
    
    console.log('🚪 Modal closed, video reset');
}

// Initialize video service
window.videoService = new VideoService();
