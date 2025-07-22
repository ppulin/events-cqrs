import { Injectable, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { CreateUserCommand } from '../commands/create-user.command';
import { AbstractCommand } from '../commands/abstract.command';

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private readonly client = new SQSClient({ region: 'your-region' });
  private readonly queueUrl =
    'https://sqs.your-region.amazonaws.com/account-id/YourQueue';

  constructor(private readonly commandBus: CommandBus) {}

  onModuleInit() {
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
            const body = JSON.parse(message.Body!);

            let command: AbstractCommand<any>;
            switch (body.type) {
              case CreateUserCommand.name:
                command = plainToInstance(CreateUserCommand, body.data);
                break;
              default:
                console.warn(`Unknown command type: ${body.type}`);
                continue;
            }

            command.fromTransport = true;
            await this.commandBus.execute(command);

            await this.client.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              }),
            );
          }
        }
      } catch (err) {
        console.error('SQS polling error:', err);
      }
    }
  }
}
