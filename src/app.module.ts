import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { CreateUserHandler } from './handlers/create-user.handler';
import { SnsPublisherService } from './services/sns-publisher.service';
import { CommandInterceptor } from './interceptors/command-interceptor';
import { SqsConsumerService } from './consumers/sqs-consumer.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CqrsModule],
  controllers: [AppController],
  providers: [
    AppService,
    CreateUserHandler,
    SnsPublisherService,
    SqsConsumerService,
    CommandInterceptor, // перехватываем execute
  ],
})
export class AppModule {}
