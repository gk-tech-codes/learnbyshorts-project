#!/usr/bin/env python3
"""
DynamoDB Table Creation Script for LearnByShorts Authentication System
Professional schema design with single-table pattern for scalability
"""

import boto3
import json
from botocore.exceptions import ClientError

def create_tables():
    dynamodb = boto3.client('dynamodb', region_name='us-east-1')
    
    # Main table using single-table design pattern
    table_name = 'learnbyshorts-data'
    
    try:
        # Create main data table
        response = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'PK',  # Partition Key
                    'KeyType': 'HASH'
                },
                {
                    'AttributeName': 'SK',  # Sort Key
                    'KeyType': 'RANGE'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'PK',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'SK',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'GSI1PK',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'GSI1SK',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {
                            'AttributeName': 'GSI1PK',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'GSI1SK',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                }
            ],
            BillingMode='PAY_PER_REQUEST',  # On-demand pricing
            Tags=[
                {
                    'Key': 'Project',
                    'Value': 'LearnByShorts'
                },
                {
                    'Key': 'Environment',
                    'Value': 'Production'
                }
            ]
        )
        
        print(f"✅ Created table: {table_name}")
        print(f"📊 Table ARN: {response['TableDescription']['TableArn']}")
        
        # Wait for table to be active
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"🚀 Table {table_name} is now active!")
        
        return True
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"⚠️  Table {table_name} already exists")
            return True
        else:
            print(f"❌ Error creating table: {e}")
            return False

def print_schema_documentation():
    """Print the schema design documentation"""
    
    schema_doc = """
    
🗄️  DYNAMODB SCHEMA DESIGN (Single Table Pattern)
=================================================

Table: learnbyshorts-data

📋 ENTITY PATTERNS:
------------------

1️⃣  USER PROFILE:
   PK: USER#{user_id}
   SK: PROFILE
   Data: {google_id, email, name, avatar, created_at, last_login, preferences}

2️⃣  USER PROGRESS:
   PK: USER#{user_id}
   SK: PROGRESS#{course_id}
   Data: {course_id, topic_index, completed_topics, last_accessed, completion_percentage}

3️⃣  USER SESSION:
   PK: USER#{user_id}
   SK: SESSION#{session_id}
   Data: {session_token, expires_at, device_info, ip_address}
   TTL: expires_at (auto-delete)

4️⃣  COURSE ANALYTICS:
   PK: ANALYTICS#{course_id}
   SK: USER#{user_id}
   Data: {time_spent, completion_rate, audio_usage, last_topic}

📊 GSI1 (Global Secondary Index):
--------------------------------
   GSI1PK: EMAIL#{email} or GOOGLE#{google_id}
   GSI1SK: USER#{user_id}
   Purpose: Login by email/Google ID lookup

🔍 QUERY PATTERNS:
-----------------
• Get user profile: PK=USER#123, SK=PROFILE
• Get user progress: PK=USER#123, SK begins_with(PROGRESS#)
• Login by email: GSI1PK=EMAIL#user@example.com
• Login by Google ID: GSI1PK=GOOGLE#google_user_id
• Get course analytics: PK=ANALYTICS#course-id, SK begins_with(USER#)

💰 COST OPTIMIZATION:
--------------------
• Single table reduces costs
• On-demand billing scales with usage
• GSI only for essential queries
• TTL for automatic session cleanup
    """
    
    print(schema_doc)

if __name__ == "__main__":
    print("🚀 Creating DynamoDB tables for LearnByShorts...")
    
    if create_tables():
        print_schema_documentation()
        print("✅ Database setup complete!")
    else:
        print("❌ Database setup failed!")
