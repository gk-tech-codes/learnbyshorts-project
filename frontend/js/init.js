/**
 * Initialization script for LearnByShorts
 * Handles the transition from static to dynamic content
 */

// Hide fallback content when dynamic content loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, waiting for components to initialize...');
    
    // Check immediately if components are already initialized
    checkAndHideFallback();
    
    // Also check after a delay to give components time to initialize
    setTimeout(checkAndHideFallback, 1000);
    setTimeout(checkAndHideFallback, 2000);
});

function checkAndHideFallback() {
    console.log('Checking if components are initialized...');
    
    // Check if HomePage has initialized
    if (window.homePage && window.homePage.isInitialized) {
        console.log('HomePage is initialized, checking for rendered components...');
        
        // Check if any components have been rendered
        const hasRenderedComponents = document.querySelector('header.header') || 
                                    document.querySelector('section.hero') || 
                                    document.querySelector('main.main-content');
        
        if (hasRenderedComponents) {
            console.log('Components have been rendered, hiding fallback content');
            const fallbackContent = document.getElementById('fallback-content');
            if (fallbackContent) {
                fallbackContent.style.display = 'none';
                console.log('Fallback content hidden');
            }
        } else {
            console.log('No components have been rendered yet');
        }
    } else {
        console.log('HomePage is not initialized yet');
    }
}
