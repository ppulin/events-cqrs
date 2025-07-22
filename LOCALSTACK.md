# LocalStack Setup for SNS and SQS

## Overview

This project uses LocalStack for local development with AWS SNS and SQS services.

## LocalStack Setup

### 1. Starting LocalStack

LocalStack is already configured and running with the necessary services:

```bash
# Check LocalStack status
docker ps | grep localstack

# Check service availability
curl http://localhost:4566/_localstack/health
```

### 2. AWS Resource Setup

Run the setup script to create SNS topic and SQS queue:

```bash
./setup-localstack.sh
```

This script will create:
- SNS topic: `user-events-topic`
- SQS queue: `user-events-queue`
- SNS → SQS subscription
- Required access policies

### 3. Testing

To test SNS and SQS functionality:

```bash
./test-sns-sqs.sh
```

## Running the Application

### With LocalStack

```bash
./start-localstack.sh
```

### Without LocalStack (production)

```bash
npm run start:dev
```

## Configuration

### Environment Variables for LocalStack

File `localstack.env` contains:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566
AWS_TOPIC=arn:aws:sns:us-east-1:000000000000:user-events-topic
AWS_QUEUE=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-events-queue
```

### AWS CLI Commands for LocalStack

All AWS CLI commands must use the endpoint URL:

```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 <command>
```

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   NestJS    │───▶│     SNS     │───▶│     SQS     │
│  App        │    │   Topic     │    │   Queue     │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐    ┌─────────────┐
                    │   SNS       │    │   SQS       │
                    │ Publisher   │    │ Consumer    │
                    └─────────────┘    └─────────────┘
```

## Useful Commands

### View SNS Topics
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sns list-topics
```

### View SQS Queues
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs list-queues
```

### View Subscriptions
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sns list-subscriptions
```

### Send Test Message
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sns publish \
  --topic-arn arn:aws:sns:us-east-1:000000000000:user-events-topic \
  --message '{"test": "message"}'
```

### Receive Messages from Queue
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-events-queue
```

## Troubleshooting

### LocalStack Not Responding
```bash
docker restart localstack
```

### Services Unavailable
Check that LocalStack is running with the required services:
```bash
docker run -d --name localstack -p 4566:4566 -e SERVICES=sns,sqs,lambda localstack/localstack
```

### AWS CLI Issues
Make sure you're using the correct endpoint and region:
```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
```