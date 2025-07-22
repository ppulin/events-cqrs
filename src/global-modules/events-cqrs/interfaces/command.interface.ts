import { ICommand } from '@nestjs/cqrs';

export interface ITransportableCommand extends ICommand {
  fromTransport?: boolean;
  data: any;
}

export interface ICommandMetadata {
  eventType: string;
  sourceService: string;
  timestamp: string;
}