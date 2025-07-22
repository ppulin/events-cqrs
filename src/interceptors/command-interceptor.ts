import { Injectable, OnModuleInit } from '@nestjs/common';
import { CommandBus, ICommand } from '@nestjs/cqrs';
import { SnsPublisherService } from '../services/sns-publisher.service';

@Injectable()
export class CommandInterceptor implements OnModuleInit {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly snsPublisher: SnsPublisherService,
  ) {}

  onModuleInit() {
    const originalExecute = this.commandBus.execute.bind(this.commandBus);

    this.commandBus.execute = async <T extends ICommand, R = any>(command: T): Promise<R> => {
      const result = await originalExecute(command);

      // Только если команда пришла не извне
      if (!(command as any).fromTransport) {
        await this.snsPublisher.publishCommand(command);
      }

      return result;
    };
  }
}
