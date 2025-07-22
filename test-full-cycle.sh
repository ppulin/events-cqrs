#!/bin/bash

# Загрузка переменных окружения
export $(cat localstack.env | xargs)

echo "=== Тестирование полного цикла SNS -> SQS ==="
echo ""

echo "1. Отправка сообщения в SNS топик..."
aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sns publish \
    --topic-arn $AWS_TOPIC \
    --message '{"event": "user.created", "userId": "456", "email": "user@example.com", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'

echo ""
echo "2. Ожидание доставки сообщения (5 секунд)..."
sleep 5

echo ""
echo "3. Получение сообщений из SQS очереди..."
aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sqs receive-message \
    --queue-url $AWS_QUEUE \
    --max-number-of-messages 10 \
    --wait-time-seconds 5 \
    --message-attribute-names All

echo ""
echo "4. Проверка статуса подписок..."
aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sns list-subscriptions

echo ""
echo "=== Тест завершен ==="