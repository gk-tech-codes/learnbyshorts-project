const fs = require('fs');
const https = require('https');

// YouTube oEmbed API to get video data
function fetchYouTubeData(videoId) {
    return new Promise((resolve, reject) => {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const videoData = JSON.parse(data);
                    resolve({
                        title: videoData.title,
                        author: videoData.author_name,
                        thumbnail: videoData.thumbnail_url,
                        description: `Video by ${videoData.author_name}`,
                        width: videoData.width,
                        height: videoData.height
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Update video config with real YouTube data
async function updateVideoConfig() {
    try {
        // Read current config
        const configPath = './frontend/data/youtube-videos.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        console.log('📺 Fetching YouTube data for', config.videos.length, 'videos...');
        
        // Update each video with real YouTube data
        for (let i = 0; i < config.videos.length; i++) {
            const video = config.videos[i];
            console.log(`\n🔄 Fetching data for: ${video.youtubeId}`);
            
            try {
                const youtubeData = await fetchYouTubeData(video.youtubeId);
                
                // Update with real YouTube data
                config.videos[i] = {
                    ...video,
                    title: youtubeData.title,
                    description: youtubeData.description,
                    author: youtubeData.author,
                    thumbnail: youtubeData.thumbnail,
                    lastUpdated: new Date().toISOString()
                };
                
                console.log(`✅ Updated: ${youtubeData.title}`);
                console.log(`   Author: ${youtubeData.author}`);
                
            } catch (error) {
                console.log(`❌ Failed to fetch data for ${video.youtubeId}:`, error.message);
            }
        }
        
        // Write updated config back to file
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('\n✅ Video configuration updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating video config:', error);
    }
}

// Run the update
updateVideoConfig();
