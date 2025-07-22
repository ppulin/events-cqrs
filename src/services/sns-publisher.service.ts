import { Injectable, OnModuleInit } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SnsPublisherService implements OnModuleInit {
  private client: SNSClient;
  private topicArn: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new SNSClient({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    });
    this.topicArn = this.configService.getOrThrow<string>('AWS_TOPIC');
  }

  async publishCommand(command: any): Promise<void> {
    const message = JSON.stringify({
      type: command.constructor.name,
      data: command.data,
    });

    const publishCommand = new PublishCommand({
      TopicArn: this.topicArn,
      Message: message,
      MessageAttributes: {
        type: {
          DataType: 'String',
          StringValue: command.constructor.name,
        },
      },
    });

    await this.client.send(publishCommand);
  }
}
