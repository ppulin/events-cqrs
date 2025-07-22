#!/bin/bash

# Настройка AWS CLI для LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

TOPIC_ARN="arn:aws:sns:us-east-1:000000000000:user-events-topic"
QUEUE_URL="http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-events-queue"

echo "Отправка сообщения в SNS топик..."
aws --endpoint-url=$AWS_ENDPOINT_URL sns publish \
    --topic-arn $TOPIC_ARN \
    --message '{"event": "user.created", "userId": "123", "email": "test@example.com", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'

echo "Ожидание 3 секунды для доставки сообщения..."
sleep 3

echo "Получение сообщений из SQS очереди..."
aws --endpoint-url=$AWS_ENDPOINT_URL sqs receive-message \
    --queue-url $QUEUE_URL \
    --max-number-of-messages 10 \
    --wait-time-seconds 5