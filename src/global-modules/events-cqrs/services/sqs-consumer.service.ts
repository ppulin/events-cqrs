import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { plainToInstance } from 'class-transformer';
import {
  ISnsNotification,
  IEventConsumer,
} from '../interfaces/event.interface';
import {
  EventsCqrsConfig,
  EVENTS_CQRS_CONFIG,
} from '../config/events-cqrs.config';
import { AbstractCommand } from '../commands/abstract.command';

@Injectable()
export class SqsConsumerService implements OnModuleInit, IEventConsumer {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private serviceName: string;
  private isRunning = false;
  private commandMappings = new Map<
    string,
    new (...args: any[]) => AbstractCommand<any>
  >();

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(EVENTS_CQRS_CONFIG) private readonly config: EventsCqrsConfig,
  ) {}

  onModuleInit() {
    this.serviceName = this.config.serviceName;
    this.queueUrl = this.config.sqs.queueUrl;

    this.client = new SQSClient({
      region: this.config.aws.region,
      ...(this.config.aws.endpoint && {
        endpoint: this.config.aws.endpoint,
        credentials: this.config.aws.credentials,
      }),
    });

    this.start();
  }

  registerCommand(
    commandType: string,
    commandClass: new (...args: any[]) => AbstractCommand<any>,
  ): void {
    this.commandMappings.set(commandType, commandClass);
  }

  start(): void {
    this.isRunning = true;
    this.poll();
  }

  stop(): void {
    this.isRunning = false;
  }

  private async poll(): Promise<void> {
    while (this.isRunning) {
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
    const body: ISnsNotification = JSON.parse(message.Body!);
    if (body.MessageAttributes.sourceService.Value === this.serviceName) {
      this.logger.warn(
        `Geo message from myself: ${body.MessageAttributes.eventType.Value}`,
      );
      return null;
    }

    const commandType = body.MessageAttributes.eventType.Value;
    const CommandClass = this.commandMappings.get(commandType);

    if (CommandClass) {
      const command = plainToInstance(CommandClass, { data: body.Message });
      command.fromTransport = true;
      this.logger.log(`Got command ${commandType} ${message.MessageId}`);
      return command;
    } else {
      this.logger.warn(`Unknown command type: ${commandType}`);
      return null;
    }
  }
}
