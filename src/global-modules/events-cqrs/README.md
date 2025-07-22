# Events CQRS Module

Модуль для интеграции CQRS с AWS SNS/SQS для прозрачной работы с событиями между сервисами.

## Возможности

- Автоматическая публикация команд в SNS
- Автоматическое потребление команд из SQS
- Регистрация команд через SqsConsumerService
- Конфигурируемая настройка AWS через ConfigService
- Изоляция логики транспорта от бизнес-логики

## Установка

Модуль уже включен в проект в папке `src/global-modules/events-cqrs/`.

## Использование

### 1. Импорт модуля

#### Способ 1: forRootAsync (рекомендуется)
Стандартная схема с useFactory и ConfigService:

```typescript
import { EventsCqrsModule } from './global-modules/events-cqrs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsCqrsModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        aws: {
          region: configService.getOrThrow<string>('AWS_REGION'),
          endpoint: configService.get<string>('AWS_ENDPOINT_URL'),
          credentials: {
            accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
          },
        },
        sns: {
          topicArn: configService.getOrThrow<string>('AWS_TOPIC'),
        },
        sqs: {
          queueUrl: configService.getOrThrow<string>('AWS_QUEUE'),
        },
        serviceName: configService.getOrThrow<string>('SERVICE_NAME'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Способ 2: forRoot
Прямая передача конфигурации:

```typescript
import { EventsCqrsModule } from './global-modules/events-cqrs';

@Module({
  imports: [
    EventsCqrsModule.forRoot({
      aws: {
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      },
      sns: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:test-topic',
      },
      sqs: {
        queueUrl: 'http://localhost:4566/000000000000/test-queue',
      },
      serviceName: 'my-service',
    }),
  ],
})
export class AppModule {}
```

### 2. Создание команд

```typescript
import { AbstractCommand } from './global-modules/events-cqrs';

export class CreateUserCommand extends AbstractCommand<{
  name: string;
  id: string;
}> {
  static readonly type = 'CreateUserCommand';
}
```

### 3. Регистрация команд

```typescript
import { OnModuleInit } from '@nestjs/common';
import { SqsConsumerService, CreateUserCommand } from './global-modules/events-cqrs';

export class AppModule implements OnModuleInit {
  constructor(private readonly sqsConsumer: SqsConsumerService) {}

  onModuleInit() {
    // Регистрируем команды для SQS Consumer
    this.sqsConsumer.registerCommand(CreateUserCommand.name, CreateUserCommand);
  }
}
```

### 4. Использование CustomCommandBus

```typescript
import { CustomCommandBusService } from './global-modules/events-cqrs';

@Controller()
export class AppController {
  constructor(private readonly customCommandBus: CustomCommandBusService) {}

  @Post('create-user')
  async createUser(@Body() body: { name: string; id: string }) {
    const command = new CreateUserCommand();
    command.data = body;

    await this.customCommandBus.execute(command);

    return { message: 'User creation command sent', id: body.id };
  }
}
```

## Конфигурация

### Переменные окружения (для forRootAsync)

```bash
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_TOPIC=arn:aws:sns:us-east-1:000000000000:test-topic
AWS_QUEUE=http://localhost:4566/000000000000/test-queue
SERVICE_NAME=my-service
```

### EventsCqrsConfig (для forRoot)

```typescript
interface EventsCqrsConfig {
  aws: {
    region: string;
    endpoint?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  sns: {
    topicArn: string;
  };
  sqs: {
    queueUrl: string;
  };
  serviceName: string;
}
```

## Архитектура

- **AbstractCommand**: Базовая команда с поддержкой транспорта
- **SnsPublisherService**: Публикация команд в SNS
- **SqsConsumerService**: Потребление команд из SQS с регистрацией
- **CustomCommandBusService**: Обертка над CommandBus с автоматической публикацией

## Принцип работы

1. При выполнении команды через `CustomCommandBusService`
2. Команда выполняется локально через стандартный `CommandBus`
3. Если команда не пришла извне (`fromTransport = false`), она публикуется в SNS
4. SQS Consumer получает сообщения из SNS через SQS
5. Сообщения десериализуются в команды через зарегистрированные классы
6. Команды выполняются локально с флагом `fromTransport = true`

## Преимущества forRootAsync

- Стандартная схема NestJS модулей
- Конфигурация берется из `ConfigService` и переменных окружения
- Легко переключаться между окружениями (dev, staging, prod)
- Соответствует принципам 12-factor app
- Возможность инжектировать дополнительные зависимости