import { AbstractCommand } from '../global-modules/events-cqrs';

export class UpdateUserCommand extends AbstractCommand<{
  id: string;
  name?: string;
  email?: string;
}> {
  static readonly type = 'UpdateUserCommand';

  shouldPublish = false;
}
