import { Controller, Get } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { AppService } from './app.service';
import { plainToInstance } from 'class-transformer';
import { CreateUserCommand } from './commands/create-user.command';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('create-event')
  async createEvent(): Promise<any> {
    const command = plainToInstance(CreateUserCommand, {
      data: {
        name: 'controller',
        id: uuidv4(),
      },
    });

    const res = await this.commandBus.execute(command);

    return {
      status: 'OK',
      res,
    };
  }
}
