import { Module, DynamicModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  EventsCqrsConfig,
  EVENTS_CQRS_CONFIG,
} from './config/events-cqrs.config';
import { SnsPublisherService } from './services/sns-publisher.service';
import { SqsConsumerService } from './services/sqs-consumer.service';
import { CustomCommandBusService } from './services/custom-command-bus.service';

export interface EventsCqrsModuleOptions {
  useFactory: (configService: ConfigService) => EventsCqrsConfig;
  inject: any[];
}

@Module({})
export class EventsCqrsModule {
  static forRoot(config: EventsCqrsConfig): DynamicModule {
    return {
      module: EventsCqrsModule,
      imports: [CqrsModule],
      providers: [
        {
          provide: EVENTS_CQRS_CONFIG,
          useValue: config,
        },
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
      exports: [
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
    };
  }

  static forRootAsync(options: EventsCqrsModuleOptions): DynamicModule {
    return {
      module: EventsCqrsModule,
      imports: [CqrsModule, ConfigModule],
      providers: [
        {
          provide: EVENTS_CQRS_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
      exports: [
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
    };
  }
}
