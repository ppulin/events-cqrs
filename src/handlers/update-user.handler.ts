import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from '../commands/update-user.command';
import { Logger } from '@nestjs/common';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private logger = new Logger(UpdateUserHandler.name);

  async execute(command: UpdateUserCommand): Promise<void> {
    this.logger.log(`Executing UpdateUserCommand: ${command.data.id}`);
    // бизнес-логика обновления пользователя (локальная операция)
  }
}