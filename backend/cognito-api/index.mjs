import {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    QueryCommand
} from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME || '';
const maximumBodyBytes = Number(process.env.MAX_BODY_BYTES || 131072);
const allowedOrigins = new Set(
    String(process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
);
const courseIdPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

function response(statusCode, body, origin = '') {
    const headers = {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
    };
    if (origin && allowedOrigins.has(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers.Vary = 'Origin';
    }
    return {
        statusCode,
        headers,
        body: body === null ? '' : JSON.stringify(body)
    };
}

function requestOrigin(event) {
    const origin = event.headers?.origin || event.headers?.Origin || '';
    return allowedOrigins.has(origin) ? origin : '';
}

function verifiedUserId(event) {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims?.sub || claims.token_use !== 'access') return '';
    return String(claims.sub);
}

function decodeBody(event) {
    const raw = event.body || '';
    const buffer = event.isBase64Encoded
        ? Buffer.from(raw, 'base64')
        : Buffer.from(raw, 'utf8');
    if (buffer.byteLength > maximumBodyBytes) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        throw error;
    }
    if (buffer.byteLength === 0) return {};
    try {
        const parsed = JSON.parse(buffer.toString('utf8'));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Body must be a JSON object.');
        }
        return parsed;
    } catch (cause) {
        const error = new Error('Request body must be valid JSON.');
        error.statusCode = 400;
        error.cause = cause;
        throw error;
    }
}

function validateValue(value, depth = 0) {
    if (depth > 12) throw new Error('Progress data is nested too deeply.');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new Error('Progress contains an invalid number.');
        return value;
    }
    if (typeof value === 'string') {
        if (value.length > 20000) throw new Error('A progress value is too long.');
        return value;
    }
    if (Array.isArray(value)) {
        if (value.length > 500) throw new Error('A progress list is too long.');
        return value.map(entry => validateValue(entry, depth + 1));
    }
    if (typeof value === 'object') {
        const output = {};
        const entries = Object.entries(value);
        if (entries.length > 250) throw new Error('Progress contains too many fields.');
        for (const [key, entry] of entries) {
            if (blockedKeys.has(key) || key.length > 100) {
                throw new Error('Progress contains an invalid field.');
            }
            output[key] = validateValue(entry, depth + 1);
        }
        return output;
    }
    throw new Error('Progress contains an unsupported value.');
}

function validateState(value) {
    try {
        const state = validateValue(value);
        const encoded = JSON.stringify(state);
        if (Buffer.byteLength(encoded, 'utf8') > maximumBodyBytes) {
            const error = new Error('Progress data is too large.');
            error.statusCode = 413;
            throw error;
        }
        return state;
    } catch (error) {
        if (!error.statusCode) error.statusCode = 400;
        throw error;
    }
}

function requireCourseId(value) {
    const courseId = String(value || '').toLowerCase();
    if (!courseIdPattern.test(courseId)) {
        const error = new Error('Course identifier is invalid.');
        error.statusCode = 400;
        throw error;
    }
    return courseId;
}

function key(userId, sortKey) {
    return {
        PK: { S: `USER#${userId}` },
        SK: { S: sortKey }
    };
}

function parseStoredState(item) {
    try {
        return JSON.parse(item?.State?.S || '{}');
    } catch {
        return {};
    }
}

async function getProfile(userId) {
    const result = await dynamo.send(new GetItemCommand({
        TableName: tableName,
        Key: key(userId, 'PROFILE'),
        ConsistentRead: false,
        ProjectionExpression: 'PK, SK, DisplayName, Email, CreatedAt, UpdatedAt'
    }));
    return {
        userId,
        name: result.Item?.DisplayName?.S || '',
        email: result.Item?.Email?.S || '',
        createdAt: result.Item?.CreatedAt?.S || ''
    };
}

async function getCourse(userId, courseId) {
    const result = await dynamo.send(new GetItemCommand({
        TableName: tableName,
        Key: key(userId, `COURSE#${courseId}`),
        ConsistentRead: false
    }));
    if (!result.Item) return null;
    return {
        courseId,
        state: parseStoredState(result.Item),
        updatedAt: result.Item.UpdatedAt?.S || ''
    };
}

async function getCourses(userId) {
    const result = await dynamo.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :course)',
        ExpressionAttributeValues: {
            ':pk': { S: `USER#${userId}` },
            ':course': { S: 'COURSE#' }
        },
        ConsistentRead: false
    }));
    const courses = {};
    for (const item of result.Items || []) {
        const courseId = String(item.SK?.S || '').slice('COURSE#'.length);
        if (!courseIdPattern.test(courseId)) continue;
        courses[courseId] = {
            state: parseStoredState(item),
            updatedAt: item.UpdatedAt?.S || ''
        };
    }
    return { courses };
}

async function putCourse(userId, courseId, state) {
    const updatedAt = new Date().toISOString();
    await dynamo.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            ...key(userId, `COURSE#${courseId}`),
            EntityType: { S: 'COURSE_PROGRESS' },
            CourseId: { S: courseId },
            State: { S: JSON.stringify(state) },
            UpdatedAt: { S: updatedAt }
        }
    }));
    return { courseId, state, updatedAt };
}

export async function handler(event) {
    const origin = requestOrigin(event);
    const requestId = event.requestContext?.requestId || 'unknown';
    const routeKey = event.routeKey ||
        `${event.requestContext?.http?.method || ''} ${event.rawPath || ''}`;

    if (!tableName) {
        console.error(JSON.stringify({ requestId, routeKey, error: 'MissingTableConfiguration' }));
        return response(503, { error: 'The learning profile service is unavailable.' }, origin);
    }

    const userId = verifiedUserId(event);
    if (!userId) {
        return response(401, { error: 'A verified access token is required.' }, origin);
    }

    try {
        if (routeKey === 'GET /v1/me') {
            return response(200, await getProfile(userId), origin);
        }

        if (routeKey === 'GET /v1/progress') {
            return response(200, await getCourses(userId), origin);
        }

        if (routeKey === 'GET /v1/progress/{courseId}') {
            const courseId = requireCourseId(event.pathParameters?.courseId);
            const course = await getCourse(userId, courseId);
            return course
                ? response(200, course, origin)
                : response(404, { error: 'No saved progress exists for this course.' }, origin);
        }

        if (routeKey === 'PUT /v1/progress/{courseId}') {
            const courseId = requireCourseId(event.pathParameters?.courseId);
            const state = validateState(decodeBody(event));
            return response(200, await putCourse(userId, courseId, state), origin);
        }

        if (routeKey === 'POST /v1/sync') {
            const body = decodeBody(event);
            if (!body.courses || typeof body.courses !== 'object' || Array.isArray(body.courses)) {
                return response(400, { error: 'A courses object is required.' }, origin);
            }
            const entries = Object.entries(body.courses);
            if (entries.length > 20) {
                return response(400, { error: 'At most 20 courses can be synced at once.' }, origin);
            }
            const saved = await Promise.all(entries.map(async ([rawCourseId, rawState]) => {
                const courseId = requireCourseId(rawCourseId);
                const state = validateState(rawState);
                return putCourse(userId, courseId, state);
            }));
            return response(200, { synced: saved.length, courses: saved }, origin);
        }

        return response(404, { error: 'Route not found.' }, origin);
    } catch (error) {
        const statusCode = Number(error.statusCode) || 500;
        console.error(JSON.stringify({
            requestId,
            routeKey,
            error: error.name || 'Error',
            statusCode
        }));
        if (statusCode >= 500) {
            return response(500, { error: 'The learning profile request could not be completed.' }, origin);
        }
        return response(statusCode, { error: error.message }, origin);
    }
}
