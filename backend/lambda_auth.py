"""
LearnByShorts Authentication Lambda Function
Professional serverless authentication with Google OAuth
"""

import json
import boto3
import uuid
import time
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import os
from botocore.exceptions import ClientError

# Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '1029422633354-g3po2rrk765unqn98fsirmod4muipt4l.apps.googleusercontent.com')
JWT_SECRET = os.environ.get('JWT_SECRET', 'learnbyshorts-jwt-secret-2024')
TABLE_NAME = 'learnbyshorts-data'

# Use existing AWS credentials from environment
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    """Main Lambda handler with CORS support"""
    
    # CORS headers for all responses
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }
    
    try:
        # Handle API Gateway v2 format
        method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        path = event.get('path') or event.get('rawPath', '').replace('/prod', '')
        
        print(f"Method: {method}, Path: {path}")
        
        # Handle preflight OPTIONS request
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'CORS preflight'})
            }
        
        # Route to appropriate handler
        if path == '/auth/google' and method == 'POST':
            return handle_google_login(event, headers)
        elif path == '/auth/verify' and method == 'POST':
            return handle_verify_token(event, headers)
        elif path == '/auth/logout' and method == 'POST':
            return handle_logout(event, headers)
        elif path == '/user/profile' and method == 'GET':
            return handle_get_profile(event, headers)
        elif path == '/user/progress' and method == 'GET':
            return handle_get_progress(event, headers)
        elif path == '/user/progress' and method == 'POST':
            return handle_save_progress(event, headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Endpoint not found'})
            }
            
    except Exception as e:
        print(f"Lambda Error: {str(e)}")
        print(f"Event: {json.dumps(event)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }

def handle_google_login(event, headers):
    """Handle Google OAuth login"""
    
    try:
        body = json.loads(event['body'])
        google_token = body.get('credential') or body.get('token')  # Support both parameter names
        
        if not google_token:
            return error_response(headers, 'Google credential required', 400)
        
        # Verify Google token
        try:
            from google.auth.transport import requests as google_requests
            idinfo = id_token.verify_oauth2_token(
                google_token, google_requests.Request(), GOOGLE_CLIENT_ID
            )
            
            google_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo['name']
            avatar = idinfo.get('picture', '')
            
        except ValueError as e:
            return error_response(headers, 'Invalid Google token', 401)
        
        # Check if user exists
        user_id = get_user_by_google_id(google_id)
        
        if not user_id:
            # Create new user
            user_id = str(uuid.uuid4())
            create_user(user_id, google_id, email, name, avatar)
        else:
            # Update last login
            update_last_login(user_id)
        
        # Generate JWT token
        jwt_token = generate_jwt_token(user_id, email)
        
        # Create session
        session_id = create_session(user_id, jwt_token)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'token': jwt_token,
                'user': {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'avatar': avatar
                }
            })
        }
        
    except Exception as e:
        print(f"Google login error: {str(e)}")
        return error_response(headers, 'Login failed', 500)

def handle_verify_token(event, headers):
    """Verify JWT token"""
    
    try:
        auth_header = event.get('headers', {}).get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return error_response(headers, 'Invalid authorization header', 401)
        
        token = auth_header.split(' ')[1]
        
        # Verify JWT
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
            
            # Get user profile
            user_profile = get_user_profile(user_id)
            
            if not user_profile:
                return error_response(headers, 'User not found', 404)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'valid': True,
                    'user': user_profile
                })
            }
            
        except jwt.ExpiredSignatureError:
            return error_response(headers, 'Token expired', 401)
        except jwt.InvalidTokenError:
            return error_response(headers, 'Invalid token', 401)
            
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return error_response(headers, 'Verification failed', 500)

def handle_get_progress(event, headers):
    """Get user progress"""
    
    user_id = get_user_from_token(event)
    if not user_id:
        return error_response(headers, 'Unauthorized', 401)
    
    try:
        # Get all progress records for user
        response = table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk': 'PROGRESS#'
            }
        )
        
        progress_data = {}
        for item in response['Items']:
            course_id = item['SK'].replace('PROGRESS#', '')
            progress_data[course_id] = {
                'topic_index': item.get('topic_index', 0),
                'completed_topics': item.get('completed_topics', []),
                'completion_percentage': item.get('completion_percentage', 0),
                'last_accessed': item.get('last_accessed')
            }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'progress': progress_data
            })
        }
        
    except Exception as e:
        print(f"Get progress error: {str(e)}")
        return error_response(headers, 'Failed to get progress', 500)

def handle_save_progress(event, headers):
    """Save user progress"""
    
    user_id = get_user_from_token(event)
    if not user_id:
        return error_response(headers, 'Unauthorized', 401)
    
    try:
        body = json.loads(event['body'])
        course_id = body.get('course_id')
        topic_index = body.get('topic_index', 0)
        completed_topics = body.get('completed_topics', [])
        
        if not course_id:
            return error_response(headers, 'Course ID required', 400)
        
        # Calculate completion percentage
        total_topics = body.get('total_topics', len(completed_topics))
        completion_percentage = (len(completed_topics) / total_topics * 100) if total_topics > 0 else 0
        
        # Save progress
        table.put_item(
            Item={
                'PK': f'USER#{user_id}',
                'SK': f'PROGRESS#{course_id}',
                'course_id': course_id,
                'topic_index': topic_index,
                'completed_topics': completed_topics,
                'completion_percentage': completion_percentage,
                'last_accessed': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Progress saved'
            })
        }
        
    except Exception as e:
        print(f"Save progress error: {str(e)}")
        return error_response(headers, 'Failed to save progress', 500)

# Helper functions
def get_user_by_google_id(google_id):
    """Get user ID by Google ID"""
    try:
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :gsi1pk',
            ExpressionAttributeValues={
                ':gsi1pk': f'GOOGLE#{google_id}'
            }
        )
        
        if response['Items']:
            return response['Items'][0]['GSI1SK'].replace('USER#', '')
        return None
        
    except Exception as e:
        print(f"Error getting user by Google ID: {str(e)}")
        return None

def create_user(user_id, google_id, email, name, avatar):
    """Create new user"""
    
    timestamp = datetime.utcnow().isoformat()
    
    # User profile
    table.put_item(
        Item={
            'PK': f'USER#{user_id}',
            'SK': 'PROFILE',
            'GSI1PK': f'GOOGLE#{google_id}',
            'GSI1SK': f'USER#{user_id}',
            'google_id': google_id,
            'email': email,
            'name': name,
            'avatar': avatar,
            'created_at': timestamp,
            'last_login': timestamp,
            'preferences': {
                'audio_enabled': True,
                'theme': 'light',
                'language': 'en'
            }
        }
    )
    
    # Email lookup
    table.put_item(
        Item={
            'PK': f'EMAIL#{email}',
            'SK': f'USER#{user_id}',
            'GSI1PK': f'EMAIL#{email}',
            'GSI1SK': f'USER#{user_id}',
            'user_id': user_id
        }
    )

def get_user_profile(user_id):
    """Get user profile"""
    try:
        response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': 'PROFILE'
            }
        )
        
        if 'Item' in response:
            item = response['Item']
            return {
                'id': user_id,
                'email': item['email'],
                'name': item['name'],
                'avatar': item['avatar'],
                'preferences': item.get('preferences', {}),
                'created_at': item['created_at'],
                'last_login': item['last_login']
            }
        return None
        
    except Exception as e:
        print(f"Error getting user profile: {str(e)}")
        return None

def generate_jwt_token(user_id, email):
    """Generate JWT token"""
    
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def create_session(user_id, token):
    """Create user session"""
    
    session_id = str(uuid.uuid4())
    expires_at = int((datetime.utcnow() + timedelta(days=7)).timestamp())
    
    table.put_item(
        Item={
            'PK': f'USER#{user_id}',
            'SK': f'SESSION#{session_id}',
            'session_token': token,
            'expires_at': expires_at,
            'created_at': datetime.utcnow().isoformat(),
            'TTL': expires_at  # Auto-delete expired sessions
        }
    )
    
    return session_id

def update_last_login(user_id):
    """Update user's last login timestamp"""
    
    table.update_item(
        Key={
            'PK': f'USER#{user_id}',
            'SK': 'PROFILE'
        },
        UpdateExpression='SET last_login = :timestamp',
        ExpressionAttributeValues={
            ':timestamp': datetime.utcnow().isoformat()
        }
    )

def get_user_from_token(event):
    """Extract user ID from JWT token"""
    
    try:
        auth_header = event.get('headers', {}).get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        return payload['user_id']
        
    except:
        return None

def error_response(headers, message, status_code):
    """Generate error response"""
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps({'error': message})
    }
