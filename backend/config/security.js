'use strict';

const INSECURE_SECRET_MARKERS = [
    'your-' + 'secret-key',
    'learnbyshorts-' + 'jwt-secret',
    'replace-with-at-least-32-random-characters'
];

function requireJwtSecret() {
    const secret = process.env.JWT_SECRET;
    const invalid =
        typeof secret !== 'string' ||
        Buffer.byteLength(secret, 'utf8') < 32 ||
        INSECURE_SECRET_MARKERS.some(marker => secret.includes(marker));

    if (invalid) {
        throw new Error(
            'JWT_SECRET must be a non-placeholder secret of at least 32 bytes'
        );
    }

    return secret;
}

function getAllowedOrigins(environment = process.env.NODE_ENV || 'development') {
    if (environment !== 'production') {
        return [
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
    }

    const origins = String(process.env.CORS_ORIGIN || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    if (origins.length === 0) {
        throw new Error('CORS_ORIGIN is required in production');
    }

    for (const origin of origins) {
        const parsed = new URL(origin);
        if (parsed.protocol !== 'https:' || parsed.origin !== origin) {
            throw new Error(
                `CORS_ORIGIN must contain exact HTTPS origins: ${origin}`
            );
        }
    }

    return origins;
}

module.exports = {
    getAllowedOrigins,
    requireJwtSecret
};
