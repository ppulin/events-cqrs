import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AbstractCommand } from './abstract.command';

export interface CommandMapping {
  commandType: string;
  commandClass: new (...args: any[]) => AbstractCommand<any>;
}

@Injectable()
export class CommandRegistry {
  private commandMappings = new Map<
    string,
    new (...args: any[]) => AbstractCommand<any>
  >();

  registerCommand(
    commandType: string,
    commandClass: new (...args: any[]) => AbstractCommand<any>,
  ): void {
    this.commandMappings.set(commandType, commandClass);
  }

  registerCommands(mappings: CommandMapping[]): void {
    mappings.forEach((mapping) => {
      this.registerCommand(mapping.commandType, mapping.commandClass);
    });
  }

  createCommand(commandType: string, data: any): AbstractCommand<any> | null {
    const CommandClass = this.commandMappings.get(commandType);
    if (!CommandClass) {
      return null;
    }

    const command = plainToInstance(CommandClass, { data });
    command.fromTransport = true;
    return command;
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.commandMappings.keys());
  }
}
