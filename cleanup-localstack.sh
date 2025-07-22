#!/bin/bash

# Загрузка переменных окружения
export $(cat localstack.env | xargs)

echo "Очистка ресурсов LocalStack..."

echo "Удаление подписок..."
SUBSCRIPTIONS=$(aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sns list-subscriptions --query 'Subscriptions[].SubscriptionArn' --output text)
for sub in $SUBSCRIPTIONS; do
    if [[ $sub != "PendingConfirmation" ]]; then
        aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sns unsubscribe --subscription-arn $sub
    fi
done

echo "Удаление SNS топика..."
aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sns delete-topic --topic-arn $AWS_TOPIC

echo "Удаление SQS очереди..."
aws --endpoint-url=$AWS_ENDPOINT_URL --region $AWS_REGION sqs delete-queue --queue-url $AWS_QUEUE

echo "Очистка завершена!"