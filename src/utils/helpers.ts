export interface CommandInput {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'folder';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface CommandDefinition {
  name: string;
  category: string;
  description: string;
  command: string;
  inputs: CommandInput[];
}

export interface RecentCommand {
  command: string;
  commandName: string;
  category: string;
  timestamp: number;
}

const DANGEROUS_PATTERNS = [
  'rm -rf',
  'rm -r /',
  'rm -rf /',
  'git reset --hard',
  'git clean -fd',
  'docker system prune',
  'sudo rm',
  'dd if=',
  'mkfs.',
  ':(){ :|:& };:',
  '> /dev/sda',
  'sudo dd',
];

export function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern =>
    command.toLowerCase().includes(pattern.toLowerCase())
  );
}

export function buildCommand(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }
  return result;
}

export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 64; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
