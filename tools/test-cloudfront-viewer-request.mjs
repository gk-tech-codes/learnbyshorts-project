import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('infra/cloudfront-viewer-request.js', 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context);

function request(host, uri, querystring = {}) {
    return {
        request: {
            uri,
            headers: {host: {value: host}},
            querystring
        }
    };
}

let result = context.handler(request('learnbyshorts.com', '/courses/ai-fluency/', {
    source: {value: 'search'}
}));
assert.equal(result.statusCode, 301);
assert.equal(
    result.headers.location.value,
    'https://www.learnbyshorts.com/courses/ai-fluency/?source=search'
);

result = context.handler(request('www.learnbyshorts.com', '/shorts.html'));
assert.equal(result.statusCode, 301);
assert.equal(result.headers.location.value, 'https://www.learnbyshorts.com/modern-skills/');

result = context.handler(request('www.learnbyshorts.com', '/modern-skills/'));
assert.equal(result.uri, '/modern-skills/index.html');

result = context.handler(request('www.learnbyshorts.com', '/assets/logo.svg'));
assert.equal(result.uri, '/assets/logo.svg');

result = context.handler(request('www.learnbyshorts.com', '/'));
assert.equal(result.uri, '/');

console.log('CloudFront viewer-request QA passed: canonical redirects, legacy redirects, query preservation, and nested URI rewrites.');
