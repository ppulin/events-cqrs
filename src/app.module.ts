import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateUserHandler } from './handlers/create-user.handler';
import { CreateUserCommand } from './commands/create-user.command';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  EventsCqrsModule,
  SqsConsumerService,
} from './global-modules/events-cqrs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule,
    EventsCqrsModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        aws: {
          region: configService.getOrThrow<string>('AWS_REGION'),
          endpoint: configService.get<string>('AWS_ENDPOINT_URL'),
          credentials: {
            accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow<string>(
              'AWS_SECRET_ACCESS_KEY',
            ),
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
  controllers: [AppController],
  providers: [AppService, CreateUserHandler],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly sqsConsumer: SqsConsumerService) {}

  onModuleInit() {
    // Регистрируем команды для SQS Consumer
    this.sqsConsumer.registerCommand(CreateUserCommand.name, CreateUserCommand);
  }
}
