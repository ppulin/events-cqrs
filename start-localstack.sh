#!/bin/bash

echo "Загрузка переменных окружения для LocalStack..."
export $(cat localstack.env | xargs)

echo "Запуск приложения с LocalStack конфигурацией..."
npm run start:dev