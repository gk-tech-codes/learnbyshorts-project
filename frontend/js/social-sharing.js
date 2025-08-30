// Professional Social Sharing Functions
const SHARE_DATA = {
    url: 'https://www.learnbyshorts.com',
    title: 'LearnByShorts - Learn Computer Science Through Short Stories',
    description: 'Master complex computer science concepts through engaging stories! From design patterns to algorithms, make learning intuitive and memorable. 📚✨',
    hashtags: 'LearnByShorts,ComputerScience,Programming,Learning,Education'
};

function shareToWhatsApp() {
    const text = `${SHARE_DATA.title}\n\n${SHARE_DATA.description}\n\n${SHARE_DATA.url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

function shareToTwitter() {
    const text = `${SHARE_DATA.description}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_DATA.url)}&hashtags=${SHARE_DATA.hashtags}`;
    window.open(twitterUrl, '_blank');
}

function shareToLinkedIn() {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_DATA.url)}`;
    window.open(linkedinUrl, '_blank');
}

function shareToFacebook() {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_DATA.url)}&quote=${encodeURIComponent(SHARE_DATA.description)}`;
    window.open(facebookUrl, '_blank');
}

function copyToClipboard() {
    const textToCopy = `${SHARE_DATA.title}\n${SHARE_DATA.description}\n${SHARE_DATA.url}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopyFeedback();
        }).catch(() => {
            fallbackCopyToClipboard(textToCopy);
        });
    } else {
        fallbackCopyToClipboard(textToCopy);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopyFeedback() {
    const copyBtn = document.querySelector('.social-btn.copy');
    const originalText = copyBtn.innerHTML;
    
    copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Copied!
    `;
    copyBtn.style.background = '#10b981';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = '#6b7280';
    }, 2000);
}
