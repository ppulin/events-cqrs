import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CommandBus } from '@nestjs/cqrs';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { CreateUserCommand } from '../commands/create-user.command';
import { AbstractCommand } from '../commands/abstract.command';
import { ConfigService } from '@nestjs/config';

export interface SnsNotification {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string; // JSON-строка, которую можно дополнительно распарсить
  Timestamp: string; // ISO строка
  UnsubscribeURL: string;
  MessageAttributes: {
    eventType: {
      Type: string;
      Value: string;
    };
    sourceService: {
      Type: string;
      Value: string;
    };
  };
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private serviceName: string;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.serviceName = this.configService.getOrThrow<string>('SERVICE_NAME');
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');

    this.client = new SQSClient({
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
    this.queueUrl = this.configService.getOrThrow<string>('AWS_QUEUE');

    this.poll();
  }

  private async poll(): Promise<void> {
    while (true) {
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 3,
            MessageAttributeNames: ['All'],
          }),
        );

        if (response.Messages) {
          for (const message of response.Messages) {
            const command = this.getCommand(message);
            if (command) {
              await this.commandBus.execute(command);
            }

            await this.client.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              }),
            );
            this.logger.log(`DeleteMessageCommand ${message.ReceiptHandle}`);
          }
        }
      } catch (err) {
        this.logger.error('SQS polling error:', err);
      }
    }
  }

  private getCommand(message: Message): AbstractCommand<any> | null {
    const body: SnsNotification = JSON.parse(message.Body!);
    if (body.MessageAttributes.sourceService.Value === this.serviceName) {
      this.logger.warn(
        `Geo message from myself: ${body.MessageAttributes.eventType.Value}`,
      );
      return null;
    }

    let command: AbstractCommand<any>;
    switch (body.MessageAttributes.eventType.Value) {
      case CreateUserCommand.name:
        this.logger.log(
          `Got command ${CreateUserCommand.name} ${message.MessageId}`,
        );
        command = plainToInstance(CreateUserCommand, {
          data: body.Message,
        });
        break;
      default:
        this.logger.warn(`Unknown command type`);
        return null;
    }

    command.fromTransport = true;

    return command;
  }
}
