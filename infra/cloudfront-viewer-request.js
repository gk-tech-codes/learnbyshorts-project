function encodeQuerystring(querystring) {
    var parts = [];
    var keys = Object.keys(querystring || {});

    for (var index = 0; index < keys.length; index += 1) {
        var key = keys[index];
        var entry = querystring[key];
        var values = entry.multiValue || [entry];

        for (var valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
            parts.push(
                encodeURIComponent(key) + '=' + encodeURIComponent(values[valueIndex].value || '')
            );
        }
    }

    return parts.length ? '?' + parts.join('&') : '';
}

function redirect(location) {
    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: {
            location: {value: location},
            'cache-control': {value: 'public, max-age=86400'}
        }
    };
}

function handler(event) {
    var request = event.request;
    var host = request.headers.host && request.headers.host.value;
    var path = request.uri || '/';
    var redirects = {
        '/index.html': '/',
        '/about': '/about.html',
        '/contact': '/contact.html',
        '/design-patterns': '/design-patterns.html',
        '/category.html': '/modern-skills/',
        '/shorts.html': '/modern-skills/',
        '/singleton-course.html': '/learn-v2/',
        '/singleton-timeline.html': '/learn-v2/'
    };
    var canonicalPath = redirects[path] || path;
    var query = encodeQuerystring(request.querystring);

    if (host === 'learnbyshorts.com') {
        return redirect('https://www.learnbyshorts.com' + canonicalPath + query);
    }

    if (canonicalPath !== path) {
        return redirect('https://www.learnbyshorts.com' + canonicalPath + query);
    }

    if (path !== '/' && path.slice(-1) === '/') {
        request.uri = path + 'index.html';
    }

    return request;
}
