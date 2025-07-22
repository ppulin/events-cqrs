#!/bin/bash

# Настройка AWS CLI для LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

echo "Создание SQS очереди..."
aws --endpoint-url=$AWS_ENDPOINT_URL sqs create-queue --queue-name user-events-queue

echo "Создание SNS топика..."
aws --endpoint-url=$AWS_ENDPOINT_URL sns create-topic --name user-events-topic

echo "Получение ARN очереди..."
QUEUE_URL=$(aws --endpoint-url=$AWS_ENDPOINT_URL sqs get-queue-url --queue-name user-events-queue --query 'QueueUrl' --output text)
QUEUE_ARN="arn:aws:sqs:us-east-1:000000000000:user-events-queue"
echo "Queue URL: $QUEUE_URL"
echo "Queue ARN: $QUEUE_ARN"

echo "Получение ARN топика..."
TOPIC_ARN=$(aws --endpoint-url=$AWS_ENDPOINT_URL sns list-topics --query 'Topics[0].TopicArn' --output text)
echo "Topic ARN: $TOPIC_ARN"

echo "Настройка подписки SNS -> SQS..."
aws --endpoint-url=$AWS_ENDPOINT_URL sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol sqs \
    --notification-endpoint $QUEUE_ARN

echo "Настройка политики доступа для SQS..."
aws --endpoint-url=$AWS_ENDPOINT_URL sqs set-queue-attributes \
    --queue-url $QUEUE_URL \
    --attributes '{
        "Policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"*\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"'$TOPIC_ARN'\"}}}]}"
    }'

echo "Проверка созданных ресурсов..."
echo "SNS топики:"
aws --endpoint-url=$AWS_ENDPOINT_URL sns list-topics

echo "SQS очереди:"
aws --endpoint-url=$AWS_ENDPOINT_URL sqs list-queues

echo "Подписки:"
aws --endpoint-url=$AWS_ENDPOINT_URL sns list-subscriptions