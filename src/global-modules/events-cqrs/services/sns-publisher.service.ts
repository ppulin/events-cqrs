import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { IEventPublisher } from '../interfaces/event.interface';
import {
  EventsCqrsConfig,
  EVENTS_CQRS_CONFIG,
} from '../config/events-cqrs.config';

@Injectable()
export class SnsPublisherService implements OnModuleInit, IEventPublisher {
  private logger = new Logger(SnsPublisherService.name);

  private client: SNSClient;
  private topicArn: string;
  private serviceName: string;

  constructor(
    @Inject(EVENTS_CQRS_CONFIG) private readonly config: EventsCqrsConfig,
  ) {}

  onModuleInit() {
    this.serviceName = this.config.serviceName;
    this.topicArn = this.config.sns.topicArn;

    this.client = new SNSClient({
      region: this.config.aws.region,
      ...(this.config.aws.endpoint && {
        endpoint: this.config.aws.endpoint,
        credentials: this.config.aws.credentials,
      }),
    });
  }

  async publishCommand(command: any): Promise<void> {
    const publishCommand = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(command.data),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: command.constructor.name,
        },
        sourceService: {
          DataType: 'String',
          StringValue: this.serviceName,
        },
      },
    });

    await this.client.send(publishCommand);
    this.logger.log(`Publishing to ${command.data.id}`);
  }
}
