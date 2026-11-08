'use strict';

const assert = require('node:assert/strict');
const {
    getAllowedOrigins,
    requireJwtSecret
} = require('../backend/config/security');

const originalSecret = process.env.JWT_SECRET;
const originalCors = process.env.CORS_ORIGIN;

try {
    delete process.env.JWT_SECRET;
    assert.throws(requireJwtSecret, /at least 32 bytes/);

    process.env.JWT_SECRET = 'your-secret-key';
    assert.throws(requireJwtSecret, /at least 32 bytes/);

    process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
    assert.equal(requireJwtSecret(), process.env.JWT_SECRET);

    delete process.env.CORS_ORIGIN;
    assert.throws(
        () => getAllowedOrigins('production'),
        /CORS_ORIGIN is required/
    );

    process.env.CORS_ORIGIN = 'http://www.learnbyshorts.com';
    assert.throws(
        () => getAllowedOrigins('production'),
        /exact HTTPS origins/
    );

    process.env.CORS_ORIGIN =
        'https://www.learnbyshorts.com,https://learnbyshorts.com';
    assert.deepEqual(getAllowedOrigins('production'), [
        'https://www.learnbyshorts.com',
        'https://learnbyshorts.com'
    ]);

    assert.deepEqual(getAllowedOrigins('development'), [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]);
} finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;

    if (originalCors === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = originalCors;
}

console.log('Security configuration QA passed.');
