import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { CreateUserCommand } from '../commands/create-user.command';
import { AbstractCommand } from '../commands/abstract.command';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
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
            WaitTimeSeconds: 20,
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
    const body = JSON.parse(message.Body!);

    let command: AbstractCommand<any>;
    this.logger.log(`Got command ${JSON.stringify(body)}`);
    switch (body.type) {
      case CreateUserCommand.name:
        command = plainToInstance(CreateUserCommand, {
          data: body.data,
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
