import { AbstractCommand } from './abstract.command';

export class CreateUserCommand extends AbstractCommand<{
  name: string;
  id: string;
}> {
  static readonly type = 'CreateUserCommand';
}
