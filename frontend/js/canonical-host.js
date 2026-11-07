(function () {
    'use strict';

    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
    if (localHosts.has(window.location.hostname)) return;

    if (window.location.protocol !== 'https:' || window.location.hostname === 'learnbyshorts.com') {
        const canonical = new URL(window.location.href);
        canonical.protocol = 'https:';
        if (canonical.hostname === 'learnbyshorts.com') {
            canonical.hostname = 'www.learnbyshorts.com';
        }
        window.location.replace(canonical.href);
    }
})();
