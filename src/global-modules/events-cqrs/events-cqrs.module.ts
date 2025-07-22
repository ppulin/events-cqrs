import { Module, DynamicModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import {
  EventsCqrsConfig,
  EVENTS_CQRS_CONFIG,
} from './config/events-cqrs.config';
import { SnsPublisherService } from './services/sns-publisher.service';
import { SqsConsumerService } from './services/sqs-consumer.service';
import { CustomCommandBusService } from './services/custom-command-bus.service';
import { CommandDiscoveryService } from './services/command-discovery.service';

export interface EventsCqrsModuleOptions {
  useFactory: (configService: ConfigService) => EventsCqrsConfig;
  inject: any[];
}

@Module({})
export class EventsCqrsModule {
  static forRoot(config: EventsCqrsConfig): DynamicModule {
    return {
      module: EventsCqrsModule,
      imports: [CqrsModule, DiscoveryModule],
      providers: [
        {
          provide: EVENTS_CQRS_CONFIG,
          useValue: config,
        },
        CommandDiscoveryService,
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
      exports: [
        CommandDiscoveryService,
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
    };
  }

  static forRootAsync(options: EventsCqrsModuleOptions): DynamicModule {
    return {
      module: EventsCqrsModule,
      imports: [CqrsModule, ConfigModule, DiscoveryModule],
      providers: [
        {
          provide: EVENTS_CQRS_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        CommandDiscoveryService,
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
      exports: [
        CommandDiscoveryService,
        SnsPublisherService,
        SqsConsumerService,
        CustomCommandBusService,
      ],
    };
  }
}
