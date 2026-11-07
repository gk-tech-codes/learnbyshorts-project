(function () {
    'use strict';

    const company = new URLSearchParams(window.location.search).get('company');
    if (company && /^[a-z0-9-]{1,80}$/i.test(company)) {
        window.location.replace(`course-detail.html?id=${encodeURIComponent(company)}`);
        return;
    }
    window.location.replace('interview-companies.html');
})();
