import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

@Injectable()
export class CommandDiscoveryService {
  private logger = new Logger(CommandDiscoveryService.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  discoverCommands(): Array<{ commandClass: any; handlerClass: any }> {
    const providers = this.discoveryService.getProviders();
    const commands: Array<{ commandClass: any; handlerClass: any }> = [];

    for (const provider of providers) {
      if (provider.instance) {
        const handlerClass = provider.instance.constructor;

        // Проверяем есть ли декоратор @CommandHandler
        const commandClass = Reflect.getMetadata(
          '__commandHandler__',
          handlerClass,
        );

        if (commandClass) {
          commands.push({
            commandClass,
            handlerClass,
          });

          this.logger.log(
            `Discovered command: ${commandClass.name} -> ${handlerClass.name}`,
          );
        }
      }
    }

    return commands;
  }
}
