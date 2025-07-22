import { ICommand } from '@nestjs/cqrs';

export class AbstractCommand<T> implements ICommand {
  static readonly type: string;
  fromTransport: boolean = false;
  data: T;
}
