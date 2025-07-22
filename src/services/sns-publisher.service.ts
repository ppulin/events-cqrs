import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SnsPublisherService implements OnModuleInit {
  private logger = new Logger(SnsPublisherService.name);

  private client: SNSClient;
  private topicArn: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');

    this.client = new SNSClient({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      ...(endpoint && {
        endpoint: endpoint,
        credentials: {
          accessKeyId:
            this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.getOrThrow<string>(
            'AWS_SECRET_ACCESS_KEY',
          ),
        },
      }),
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
    this.logger.log(`Publishing to ${command.constructor.name}`);
  }
}
