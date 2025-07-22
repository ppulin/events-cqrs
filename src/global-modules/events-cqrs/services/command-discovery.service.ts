import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
export class CommandDiscoveryService {
  private logger = new Logger(CommandDiscoveryService.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  async discoverCommands(): Promise<
    Array<{ commandClass: any; handlerClass: any }>
  > {
    const providers = await this.discoveryService.getProviders();
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

  async getCommandClasses(): Promise<any[]> {
    const commands = await this.discoverCommands();
    return commands.map((cmd) => cmd.commandClass);
  }

  async getCommandNames(): Promise<string[]> {
    const commands = await this.discoverCommands();
    return commands.map((cmd) => cmd.commandClass.name);
  }
}
