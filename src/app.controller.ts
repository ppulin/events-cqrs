import { Controller, Get, Post, Body } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AppService } from './app.service';
import { CreateUserCommand } from './commands/create-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import {
  CustomCommandBusService,
} from './global-modules/events-cqrs';

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

  @Post('create-user')
  async createUserPost(@Body() body: { name: string; id: string }) {
    const command = new CreateUserCommand();
    command.data = body;

    await this.customCommandBus.execute(command);

    return { message: 'User creation command sent', id: body.id };
  }

  @Post('update-user')
  async updateUser(@Body() body: { id: string; name?: string; email?: string }) {
    const command = new UpdateUserCommand();
    command.data = body;

    await this.customCommandBus.execute(command);

    return {
      message: 'User update command executed (not published to SNS)',
      id: body.id,
    };
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
