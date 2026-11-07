"""LearnByShorts authentication and learner-progress Lambda.

Security properties:
- Google ID tokens are verified server-side.
- JWT signing fails closed when the secret is missing or weak.
- Browser origins are allow-listed.
- Sessions are revocable and stored as token hashes, not raw tokens.
- Request data is bounded and validated before DynamoDB writes.
"""

import hashlib
import hmac
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone

import boto3
import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

LOGGER = logging.getLogger()
LOGGER.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "learnbyshorts-data")
GOOGLE_CLIENT_ID = os.environ.get(
    "GOOGLE_CLIENT_ID",
    "1029422633354-g3po2rrk765unqn98fsirmod4muipt4l.apps.googleusercontent.com",
)
JWT_ISSUER = "learnbyshorts-auth"
JWT_AUDIENCE = "learnbyshorts-web"
SESSION_DAYS = 7
MAX_BODY_BYTES = 64 * 1024
COURSE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
DEFAULT_ALLOWED_ORIGINS = (
    "https://learnbyshorts.com",
    "https://www.learnbyshorts.com",
)

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)


class RequestError(Exception):
    """A safe client-facing request error."""

    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code


def now_utc():
    return datetime.now(timezone.utc)


def get_jwt_secret():
    secret = os.environ.get("JWT_SECRET", "")
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET must contain at least 32 characters")
    return secret


def allowed_origins():
    configured = os.environ.get("ALLOWED_ORIGINS", "")
    origins = configured.split(",") if configured else DEFAULT_ALLOWED_ORIGINS
    return {origin.strip().rstrip("/") for origin in origins if origin.strip()}


def get_header(event, name):
    expected = name.lower()
    for key, value in (event.get("headers") or {}).items():
        if key.lower() == expected:
            return value or ""
    return ""


def response_headers(event):
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Vary": "Origin",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    }
    origin = get_header(event, "Origin").rstrip("/")
    if origin in allowed_origins():
        headers["Access-Control-Allow-Origin"] = origin
    return headers


def json_response(event, body, status_code=200):
    return {
        "statusCode": status_code,
        "headers": response_headers(event),
        "body": json.dumps(body),
    }


def parse_json_body(event):
    raw_body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        raise RequestError("Base64 request bodies are not supported")
    if len(raw_body.encode("utf-8")) > MAX_BODY_BYTES:
        raise RequestError("Request body is too large", 413)
    try:
        body = json.loads(raw_body)
    except (TypeError, json.JSONDecodeError) as error:
        raise RequestError("A valid JSON body is required") from error
    if not isinstance(body, dict):
        raise RequestError("JSON body must be an object")
    return body


def lambda_handler(event, context):
    method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or ""
    ).upper()
    path = event.get("path") or event.get("rawPath", "")
    if path.startswith("/prod/"):
        path = path[5:]

    origin = get_header(event, "Origin").rstrip("/")
    if origin and origin not in allowed_origins():
        return json_response(event, {"error": "Origin is not allowed"}, 403)

    if method == "OPTIONS":
        return json_response(event, {"ok": True})

    routes = {
        ("POST", "/auth/google"): handle_google_login,
        ("POST", "/auth/verify"): handle_verify_token,
        ("POST", "/auth/logout"): handle_logout,
        ("GET", "/user/profile"): handle_get_profile,
        ("GET", "/user/progress"): handle_get_progress,
        ("POST", "/user/progress"): handle_save_progress,
    }

    handler = routes.get((method, path))
    if not handler:
        return json_response(event, {"error": "Endpoint not found"}, 404)

    try:
        return handler(event)
    except RequestError as error:
        return json_response(event, {"error": str(error)}, error.status_code)
    except Exception as error:
        request_id = getattr(context, "aws_request_id", "unknown")
        LOGGER.exception(
            "Unhandled authentication error request_id=%s type=%s",
            request_id,
            type(error).__name__,
        )
        return json_response(event, {"error": "Internal server error"}, 500)


def handle_google_login(event):
    body = parse_json_body(event)
    google_token = body.get("credential")
    if not isinstance(google_token, str) or not google_token:
        raise RequestError("Google credential is required")
    if len(google_token) > 8192:
        raise RequestError("Google credential is invalid", 401)

    try:
        identity = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as error:
        raise RequestError("Invalid Google credential", 401) from error

    if not identity.get("email_verified"):
        raise RequestError("A verified Google email is required", 401)

    google_id = identity.get("sub")
    email = identity.get("email")
    if not google_id or not email:
        raise RequestError("Google identity is incomplete", 401)

    name = identity.get("name") or email.split("@", 1)[0]
    avatar = identity.get("picture", "")
    user_id = get_user_by_google_id(google_id)
    if not user_id:
        user_id = str(uuid.uuid4())
        create_user(user_id, google_id, email, name, avatar)
    else:
        update_last_login(user_id)

    session_id = str(uuid.uuid4())
    token = generate_jwt_token(user_id, email, session_id)
    create_session(user_id, session_id, token)

    return json_response(
        event,
        {
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "avatar": avatar,
            },
        },
    )


def handle_verify_token(event):
    payload, _token = authenticate(event)
    profile = get_user_profile(payload["sub"])
    if not profile:
        raise RequestError("User not found", 404)
    return json_response(event, {"valid": True, "user": profile})


def handle_logout(event):
    payload, _token = authenticate(event)
    table.delete_item(
        Key={
            "PK": f"USER#{payload['sub']}",
            "SK": f"SESSION#{payload['sid']}",
        }
    )
    return json_response(event, {"success": True})


def handle_get_profile(event):
    payload, _token = authenticate(event)
    profile = get_user_profile(payload["sub"])
    if not profile:
        raise RequestError("User not found", 404)
    return json_response(event, {"user": profile})


def handle_get_progress(event):
    payload, _token = authenticate(event)
    result = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={
            ":pk": f"USER#{payload['sub']}",
            ":sk": "PROGRESS#",
        },
        Limit=200,
    )
    progress = {}
    for item in result.get("Items", []):
        course_id = item["SK"].replace("PROGRESS#", "", 1)
        progress[course_id] = {
            "topic_index": int(item.get("topic_index", 0)),
            "completed_topics": item.get("completed_topics", []),
            "completion_percentage": int(item.get("completion_percentage", 0)),
            "last_accessed": item.get("last_accessed"),
        }
    return json_response(event, {"progress": progress})


def handle_save_progress(event):
    payload, _token = authenticate(event)
    body = parse_json_body(event)
    course_id = body.get("course_id")
    if not isinstance(course_id, str) or not COURSE_ID_PATTERN.fullmatch(course_id):
        raise RequestError("Course ID is invalid")

    topic_index = body.get("topic_index", 0)
    total_topics = body.get("total_topics", 0)
    completed_topics = body.get("completed_topics", [])
    if not isinstance(topic_index, int) or not 0 <= topic_index <= 10000:
        raise RequestError("Topic index is invalid")
    if not isinstance(total_topics, int) or not 0 <= total_topics <= 10000:
        raise RequestError("Total topics is invalid")
    if (
        not isinstance(completed_topics, list)
        or len(completed_topics) > 500
        or any(not isinstance(topic, str) or len(topic) > 128 for topic in completed_topics)
    ):
        raise RequestError("Completed topics are invalid")

    denominator = total_topics or len(completed_topics)
    percentage = (
        min(100, round(len(set(completed_topics)) / denominator * 100))
        if denominator
        else 0
    )
    timestamp = now_utc().isoformat()
    table.put_item(
        Item={
            "PK": f"USER#{payload['sub']}",
            "SK": f"PROGRESS#{course_id}",
            "course_id": course_id,
            "topic_index": topic_index,
            "completed_topics": completed_topics,
            "completion_percentage": percentage,
            "last_accessed": timestamp,
            "updated_at": timestamp,
        }
    )
    return json_response(event, {"success": True})


def authenticate(event):
    authorization = get_header(event, "Authorization")
    scheme, separator, token = authorization.partition(" ")
    if separator != " " or scheme.lower() != "bearer" or not token:
        raise RequestError("Bearer authorization is required", 401)

    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            options={"require": ["exp", "iat", "jti", "sub", "sid"]},
        )
    except jwt.ExpiredSignatureError as error:
        raise RequestError("Session expired", 401) from error
    except jwt.InvalidTokenError as error:
        raise RequestError("Invalid session", 401) from error

    session = table.get_item(
        Key={
            "PK": f"USER#{payload['sub']}",
            "SK": f"SESSION#{payload['sid']}",
        },
        ConsistentRead=True,
    ).get("Item")
    if not session:
        raise RequestError("Session is no longer active", 401)
    expected_hash = session.get("token_hash", "")
    actual_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    if not hmac.compare_digest(expected_hash, actual_hash):
        raise RequestError("Invalid session", 401)
    if int(session.get("expires_at", 0)) <= int(now_utc().timestamp()):
        raise RequestError("Session expired", 401)
    return payload, token


def get_user_by_google_id(google_id):
    result = table.query(
        IndexName="GSI1",
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": f"GOOGLE#{google_id}"},
        Limit=1,
    )
    items = result.get("Items", [])
    return items[0]["GSI1SK"].replace("USER#", "", 1) if items else None


def create_user(user_id, google_id, email, name, avatar):
    timestamp = now_utc().isoformat()
    table.put_item(
        Item={
            "PK": f"USER#{user_id}",
            "SK": "PROFILE",
            "GSI1PK": f"GOOGLE#{google_id}",
            "GSI1SK": f"USER#{user_id}",
            "google_id": google_id,
            "email": email,
            "name": name,
            "avatar": avatar,
            "created_at": timestamp,
            "last_login": timestamp,
            "preferences": {
                "audio_enabled": True,
                "theme": "light",
                "language": "en",
            },
        },
        ConditionExpression="attribute_not_exists(PK)",
    )


def get_user_profile(user_id):
    item = table.get_item(
        Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
    ).get("Item")
    if not item:
        return None
    return {
        "id": user_id,
        "email": item["email"],
        "name": item["name"],
        "avatar": item.get("avatar", ""),
        "preferences": item.get("preferences", {}),
        "created_at": item["created_at"],
        "last_login": item["last_login"],
    }


def generate_jwt_token(user_id, email, session_id):
    issued_at = now_utc()
    payload = {
        "sub": user_id,
        "sid": session_id,
        "email": email,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "jti": str(uuid.uuid4()),
        "iat": issued_at,
        "exp": issued_at + timedelta(days=SESSION_DAYS),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")


def create_session(user_id, session_id, token):
    issued_at = now_utc()
    expires_at = int((issued_at + timedelta(days=SESSION_DAYS)).timestamp())
    table.put_item(
        Item={
            "PK": f"USER#{user_id}",
            "SK": f"SESSION#{session_id}",
            "token_hash": hashlib.sha256(token.encode("utf-8")).hexdigest(),
            "expires_at": expires_at,
            "created_at": issued_at.isoformat(),
            "TTL": expires_at,
        }
    )


def update_last_login(user_id):
    table.update_item(
        Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
        UpdateExpression="SET last_login = :timestamp",
        ExpressionAttributeValues={":timestamp": now_utc().isoformat()},
    )
