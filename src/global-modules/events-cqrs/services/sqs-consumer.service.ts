import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { plainToInstance } from 'class-transformer';
import { ISnsNotification, IEventConsumer } from '../interfaces/event.interface';
import { EventsCqrsConfig, EVENTS_CQRS_CONFIG } from '../config/events-cqrs.config';
import { AbstractCommand } from '../commands/abstract.command';
import { CommandDiscoveryService } from './command-discovery.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, IEventConsumer {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private serviceName: string;
  private isRunning = false;
  private commandClasses = new Map<string, any>();

  constructor(
    private readonly commandBus: CommandBus,
    private readonly commandDiscovery: CommandDiscoveryService,
    @Inject(EVENTS_CQRS_CONFIG) private readonly config: EventsCqrsConfig,
  ) {}

  async onModuleInit() {
    this.serviceName = this.config.serviceName;
    this.queueUrl = this.config.sqs.queueUrl;

    this.client = new SQSClient({
      region: this.config.aws.region,
      ...(this.config.aws.endpoint && {
        endpoint: this.config.aws.endpoint,
        credentials: this.config.aws.credentials,
      }),
    });

    // Кэшируем классы команд для быстрого доступа
    await this.cacheCommandClasses();

    this.start();
  }

  private async cacheCommandClasses(): Promise<void> {
    try {
      const commands = await this.commandDiscovery.discoverCommands();

      for (const { commandClass } of commands) {
        if (this.isAbstractCommand(commandClass)) {
          this.commandClasses.set(commandClass.name, commandClass);
          this.logger.log(`Cached command class: ${commandClass.name}`);
        } else {
          this.logger.warn(
            `Command ${commandClass.name} does not extend AbstractCommand, skipping`,
          );
        }
      }

      this.logger.log(`Cached ${this.commandClasses.size} command classes`);
    } catch (error) {
      this.logger.error('Failed to cache command classes:', error);
    }
  }

  private isAbstractCommand(commandClass: any): boolean {
    return (
      commandClass.prototype instanceof AbstractCommand ||
      commandClass.prototype.constructor === AbstractCommand ||
      AbstractCommand.isPrototypeOf(commandClass)
    );
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.poll();
  }

  async stop(): Promise<void> {
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
    const CommandClass = this.commandClasses.get(commandType);

    if (CommandClass) {
      const command = plainToInstance(CommandClass, { data: body.Message }) as AbstractCommand<any>;
      command.fromTransport = true;
      this.logger.log(`Got command ${commandType} ${message.MessageId}`);
      return command;
    } else {
      this.logger.warn(`Unknown command type: ${commandType}`);
      return null;
    }
  }
}
