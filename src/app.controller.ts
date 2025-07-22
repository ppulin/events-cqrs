import { Controller, Get } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AppService } from './app.service';
import { plainToInstance } from 'class-transformer';
import { CreateUserCommand } from './commands/create-user.command';
import { CustomCommandBus } from './commands/custom-command-bus';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly commandBus: CustomCommandBus,
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
