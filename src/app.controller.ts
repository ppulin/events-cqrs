import { Controller, Get } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AppService } from './app.service';
import { CreateUserCommand } from './commands/create-user.command';
import { CustomCommandBusService } from './global-modules/events-cqrs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly customCommandBus: CustomCommandBusService,
  ) {}

  @Get('create-user')
  async createUser() {
    const command = new CreateUserCommand();
    command.data = { name: 'My User', id: uuid() };

    await this.customCommandBus.execute(command);

    return { message: 'User creation command sent', id: command.data.id };
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
