import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../commands/create-user.command';
import { Logger } from '@nestjs/common';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  private logger = new Logger(CreateUserHandler.name);

  async execute(command: CreateUserCommand): Promise<void> {
    this.logger.log(
      'Executing CreateUserCommand:',
      JSON.stringify(command.data),
    );
    // бизнес-логика создания пользователя
  }
}
