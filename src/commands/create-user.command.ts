import { AbstractCommand } from './abstract.command';

export class CreateUserCommand extends AbstractCommand<{ name: string }> {
  static readonly type = 'CreateUserCommand';
}
