# LocalStack Setup для SNS и SQS

## Обзор

Этот проект использует LocalStack для локальной разработки с AWS сервисами SNS и SQS.

## Настройка LocalStack

### 1. Запуск LocalStack

LocalStack уже настроен и запущен с необходимыми сервисами:

```bash
# Проверка статуса LocalStack
docker ps | grep localstack

# Проверка доступности сервисов
curl http://localhost:4566/_localstack/health
```

### 2. Настройка AWS ресурсов

Запустите скрипт настройки для создания SNS топика и SQS очереди:

```bash
./setup-localstack.sh
```

Этот скрипт создаст:
- SNS топик: `user-events-topic`
- SQS очередь: `user-events-queue`
- Подписку SNS → SQS
- Необходимые политики доступа

### 3. Тестирование

Для тестирования работы SNS и SQS:

```bash
./test-sns-sqs.sh
```

## Запуск приложения

### С LocalStack

```bash
./start-localstack.sh
```

### Без LocalStack (продакшн)

```bash
npm run start:dev
```

## Конфигурация

### Переменные окружения для LocalStack

Файл `localstack.env` содержит:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566
AWS_TOPIC=arn:aws:sns:us-east-1:000000000000:user-events-topic
AWS_QUEUE=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-events-queue
```

### AWS CLI команды для LocalStack

Все AWS CLI команды должны использовать endpoint URL:

```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 <command>
```

## Архитектура

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

## Полезные команды

### Просмотр SNS топиков
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sns list-topics
```

### Просмотр SQS очередей
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs list-queues
```

### Просмотр подписок
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sns list-subscriptions
```

### Отправка тестового сообщения
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sns publish \
  --topic-arn arn:aws:sns:us-east-1:000000000000:user-events-topic \
  --message '{"test": "message"}'
```

### Получение сообщений из очереди
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-events-queue
```

## Troubleshooting

### LocalStack не отвечает
```bash
docker restart localstack
```

### Сервисы недоступны
Проверьте, что LocalStack запущен с нужными сервисами:
```bash
docker run -d --name localstack -p 4566:4566 -e SERVICES=sns,sqs,lambda localstack/localstack
```

### Проблемы с AWS CLI
Убедитесь, что используете правильный endpoint и регион:
```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
```