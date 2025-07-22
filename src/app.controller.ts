import { Controller, Get, Post, Body } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AppService } from './app.service';
import { CreateUserCommand } from './commands/create-user.command';
import { CustomCommandBusService, CommandDiscoveryService } from './global-modules/events-cqrs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly customCommandBus: CustomCommandBusService,
    private readonly commandDiscovery: CommandDiscoveryService,
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

  @Get('commands')
  async getCommands() {
    const commands = await this.commandDiscovery.discoverCommands();
    const commandNames = await this.commandDiscovery.getCommandNames();
    const { AbstractCommand } = await import('./global-modules/events-cqrs');

    return {
      totalCommands: commands.length,
      commandNames,
      commands: commands.map(({ commandClass, handlerClass }) => ({
        command: commandClass.name,
        handler: handlerClass.name,
        extendsAbstractCommand: commandClass.prototype instanceof AbstractCommand
      }))
    };
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
