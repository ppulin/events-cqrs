# Events CQRS Module

Module for integrating CQRS with AWS SNS/SQS for transparent event handling between services.

## Features

- Automatic command publishing to SNS
- Automatic command consumption from SQS
- **Automatic command discovery via @CommandHandler**
- **Dynamic command creation at event reception time**
- Configurable AWS setup through ConfigService
- Transport logic isolation from business logic

## Installation

The module is already included in the project in the `src/global-modules/events-cqrs/` folder.

## Usage

### 1. Import the Module

#### Method 1: forRootAsync (recommended)
Standard scheme with useFactory and ConfigService:

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

#### Method 2: forRoot
Direct configuration passing:

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

### 2. Creating Commands

```typescript
import { AbstractCommand } from './global-modules/events-cqrs';

export class CreateUserCommand extends AbstractCommand<{
  name: string;
  id: string;
}> {
  static readonly type = 'CreateUserCommand';
}
```

### 3. Creating Handlers

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<void> {
    // Business logic for user creation
    console.log(`Creating user: ${command.data.name}`);
  }
}
```

### 4. Automatic Discovery

**Commands are automatically discovered and cached!** No additional configuration needed.

```typescript
// Module automatically finds all commands with @CommandHandler
@Module({
  imports: [EventsCqrsModule.forRootAsync({...})],
  providers: [CreateUserHandler], // ← Automatically discovered
})
export class AppModule {}
```

### 5. Using CustomCommandBus

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

### 6. Viewing Discovered Commands

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

## Configuration

### Environment Variables (for forRootAsync)

```bash
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_TOPIC=arn:aws:sns:us-east-1:000000000000:test-topic
AWS_QUEUE=http://localhost:4566/000000000000/test-queue
SERVICE_NAME=my-service
```

### EventsCqrsConfig (for forRoot)

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

## Architecture

- **AbstractCommand**: Base command with transport support
- **CommandDiscoveryService**: Automatic command discovery via @CommandHandler
- **SnsPublisherService**: Command publishing to SNS
- **SqsConsumerService**: Command consumption from SQS with dynamic creation
- **CustomCommandBusService**: Wrapper over CommandBus with automatic publishing

## How It Works

1. When the module starts, `CommandDiscoveryService` scans all providers
2. Finds all classes with the `@CommandHandler` decorator
3. Caches command classes in `SqsConsumerService` for fast access
4. When executing a command via `CustomCommandBusService`
5. Command is executed locally via standard `CommandBus`
6. If command didn't come from outside (`fromTransport = false`), it's published to SNS
7. SQS Consumer receives messages from SNS via SQS
8. **At event reception time, command is dynamically created from cached class**
9. Commands are executed locally with `fromTransport = true` flag

## Dynamic Creation Benefits

- **Zero Configuration**: No need to manually register commands
- **DRY**: Commands are declared only once via @CommandHandler
- **Automatic Synchronization**: New commands are automatically picked up
- **Debugging**: Can view all discovered commands via API
- **Security**: Only commands with @CommandHandler are processed
- **Performance**: Command class caching for fast access
- **Flexibility**: Commands are created only when needed

## forRootAsync Benefits

- Standard NestJS module scheme
- Configuration taken from `ConfigService` and environment variables
- Easy switching between environments (dev, staging, prod)
- Follows 12-factor app principles
- Ability to inject additional dependencies