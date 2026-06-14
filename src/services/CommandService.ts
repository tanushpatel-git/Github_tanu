import { CommandDefinition } from '../utils/helpers';
import gitCommands from '../commands/git.json';

export class CommandService {
  private commands: CommandDefinition[] = [];

  constructor() {
    this.loadCommands();
  }

  private loadCommands(): void {
    const sources = [
      gitCommands,
    ];
    for (const source of sources) {
      const list = source as unknown as CommandDefinition[];
      this.commands.push(...list);
    }
  }

  getAllCommands(): CommandDefinition[] {
    return this.commands;
  }

  getCategories(): string[] {
    const categories = new Set(this.commands.map(c => c.category));
    return Array.from(categories).sort();
  }

  getCommandsByCategory(category: string): CommandDefinition[] {
    return this.commands.filter(c => c.category === category);
  }

  search(query: string): CommandDefinition[] {
    const lower = query.toLowerCase();
    return this.commands.filter(
      c =>
        c.name.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower) ||
        c.command.toLowerCase().includes(lower)
    );
  }

  getCommandByNameAndCategory(
    name: string,
    category: string
  ): CommandDefinition | undefined {
    return this.commands.find(
      c => c.name === name && c.category === category
    );
  }
}
