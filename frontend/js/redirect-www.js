// Force redirect to www version for consistency
(function() {
    if (location.hostname === 'learnbyshorts.com' && !location.hostname.startsWith('www.')) {
        // Redirect to www version
        const newUrl = 'https://www.' + location.hostname + location.pathname + location.search + location.hash;
        location.replace(newUrl);
    }
})();
