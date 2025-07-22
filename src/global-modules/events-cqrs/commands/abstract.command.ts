import { ICommand } from '@nestjs/cqrs';
import { ITransportableCommand } from '../interfaces/command.interface';

export class AbstractCommand<T> implements ITransportableCommand {
  static readonly type: string;
  fromTransport: boolean = false;
  data: T;
}