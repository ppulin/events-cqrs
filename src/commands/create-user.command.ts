import { AbstractCommand } from '../global-modules/events-cqrs';

export class CreateUserCommand extends AbstractCommand<{
  name: string;
  id: string;
}> {
  static readonly type = 'CreateUserCommand';
}
