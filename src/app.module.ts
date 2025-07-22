import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { CreateUserHandler } from './handlers/create-user.handler';
import { SnsPublisherService } from './services/sns-publisher.service';
import { SqsConsumerService } from './consumers/sqs-consumer.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomCommandBus } from './commands/custom-command-bus';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CqrsModule],
  controllers: [AppController],
  providers: [
    AppService,
    CreateUserHandler,
    SnsPublisherService,
    SqsConsumerService,
    CustomCommandBus,
  ],
})
export class AppModule {}
