import { Injectable } from '@nestjs/common';
import { CommandBus, ICommand } from '@nestjs/cqrs';
import { SnsPublisherService } from './sns-publisher.service';

@Injectable()
export class CustomCommandBusService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly snsPublisher: SnsPublisherService,
  ) {}

  async execute<T extends ICommand, R = any>(command: T): Promise<R> {
    const result = await this.commandBus.execute(command);

    // Только если команда пришла не извне
    if (!(command as any).fromTransport) {
      await this.snsPublisher.publishCommand(command);
    }

    return result;
  }
}
