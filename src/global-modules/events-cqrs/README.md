# Events CQRS Module

Модуль для интеграции CQRS с AWS SNS/SQS для прозрачной работы с событиями между сервисами.

## Возможности

- Автоматическая публикация команд в SNS
- Автоматическое потребление команд из SQS
- **Автоматическое обнаружение команд через @CommandHandler**
- **Динамическое создание команд в момент получения события**
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

### 3. Создание хендлеров

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<void> {
    // Бизнес-логика создания пользователя
    console.log(`Creating user: ${command.data.name}`);
  }
}
```

### 4. Автоматическое обнаружение

**Команды автоматически обнаруживаются и кэшируются!** Не нужно ничего дополнительно настраивать.

```typescript
// Модуль автоматически найдет все команды с @CommandHandler
@Module({
  imports: [EventsCqrsModule.forRootAsync({...})],
  providers: [CreateUserHandler], // ← Автоматически обнаружена
})
export class AppModule {}
```

### 5. Использование CustomCommandBus

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

### 6. Просмотр обнаруженных команд

```typescript
import { CommandDiscoveryService } from './global-modules/events-cqrs';

@Controller()
export class CommandsController {
  constructor(private readonly commandDiscovery: CommandDiscoveryService) {}

  @Get('commands')
  async getCommands() {
    const commands = await this.commandDiscovery.discoverCommands();
    const commandNames = await this.commandDiscovery.getCommandNames();

    return {
      totalCommands: commands.length,
      commandNames,
      commands: commands.map(({ commandClass, handlerClass }) => ({
        command: commandClass.name,
        handler: handlerClass.name
      }))
    };
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
- **CommandDiscoveryService**: Автоматическое обнаружение команд через @CommandHandler
- **SnsPublisherService**: Публикация команд в SNS
- **SqsConsumerService**: Потребление команд из SQS с динамическим созданием
- **CustomCommandBusService**: Обертка над CommandBus с автоматической публикацией

## Принцип работы

1. При старте модуля `CommandDiscoveryService` сканирует все провайдеры
2. Находит все классы с декоратором `@CommandHandler`
3. Кэширует классы команд в `SqsConsumerService` для быстрого доступа
4. При выполнении команды через `CustomCommandBusService`
5. Команда выполняется локально через стандартный `CommandBus`
6. Если команда не пришла извне (`fromTransport = false`), она публикуется в SNS
7. SQS Consumer получает сообщения из SNS через SQS
8. **В момент получения события динамически создается команда из кэшированного класса**
9. Команды выполняются локально с флагом `fromTransport = true`

## Преимущества динамического создания

- **Zero Configuration**: Не нужно регистрировать команды вручную
- **DRY**: Команды объявляются только один раз через @CommandHandler
- **Автоматическая синхронизация**: Новые команды автоматически подхватываются
- **Отладка**: Можно посмотреть все обнаруженные команды через API
- **Безопасность**: Только команды с @CommandHandler обрабатываются
- **Производительность**: Кэширование классов команд для быстрого доступа
- **Гибкость**: Команды создаются только когда нужно

## Преимущества forRootAsync

- Стандартная схема NestJS модулей
- Конфигурация берется из `ConfigService` и переменных окружения
- Легко переключаться между окружениями (dev, staging, prod)
- Соответствует принципам 12-factor app
- Возможность инжектировать дополнительные зависимости