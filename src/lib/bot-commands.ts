import { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Command metadata for UI
export interface CommandMetadata {
  command: string;
  description: string;
  usage: string;
}

export const BOT_COMMAND_METADATA: Record<string, CommandMetadata> = {
  'seed': {
    command: '/bot seed',
    description: 'Triggers conversation between AI chatbots using current personas',
    usage: '/bot seed "your conversation prompt" [--turns N] [--bots 1,2,3]'
  },
  'summary': {
    command: '/bot summary',
    description: 'Generates channel summary using RAG with semantic search',
    usage: '/bot summary "optional focus query"'
  },
  'personas': {
    command: '/bot personas',
    description: 'View current personas and enabled status of all bots',
    usage: '/bot personas'
  },
  'set-persona': {
    command: '/bot set-persona',
    description: 'Set a custom persona for any bot',
    usage: '/bot set-persona --bot1 "persona"'
  },
  'list-bots': {
    command: '/bot list-bots',
    description: 'List all available bots with their roles and enabled status',
    usage: '/bot list-bots'
  },
  'enable-bot': {
    command: '/bot enable-bot',
    description: 'Enable a specific bot to participate in conversations',
    usage: '/bot enable-bot <number>'
  },
  'disable-bot': {
    command: '/bot disable-bot',
    description: 'Disable a specific bot from participating in conversations',
    usage: '/bot disable-bot <number>'
  },
  'reset-index': {
    command: '/bot reset-index',
    description: 'Reset the RAG vector store (required after changing personas)',
    usage: '/bot reset-index'
  },
  'index': {
    command: '/bot index',
    description: 'Index channel messages in vector store for RAG functionality',
    usage: '/bot index'
  }
};

// Bot command types
export interface BaseBotCommand {
  command: string;
  prompt?: string;
}

export interface SeedCommand extends BaseBotCommand {
  command: 'seed';
  prompt: string;
  num_turns?: number;
  bots?: number[]; // Optional array of bot numbers to participate
}

export interface SetPersonaCommand extends BaseBotCommand {
  command: 'set-persona';
  botId: number;
  persona: string;
}

export interface SummaryCommand extends BaseBotCommand {
  command: 'summary';
  prompt?: string;
}

export interface IndexCommand extends BaseBotCommand {
  command: 'index';
}

export interface PersonasCommand extends BaseBotCommand {
  command: 'personas';
}

export interface ResetIndexCommand extends BaseBotCommand {
  command: 'reset-index';
}

export interface ListBotsCommand extends BaseBotCommand {
  command: 'list-bots';
}

export interface EnableBotCommand extends BaseBotCommand {
  command: 'enable-bot';
  botId: number;
}

export interface DisableBotCommand extends BaseBotCommand {
  command: 'disable-bot';
  botId: number;
}

export type BotCommand = 
  | SeedCommand 
  | SetPersonaCommand 
  | SummaryCommand 
  | IndexCommand 
  | PersonasCommand 
  | ResetIndexCommand
  | ListBotsCommand
  | EnableBotCommand
  | DisableBotCommand;

// Helper function to parse bot commands
export function parseBotCommand(content: string): BotCommand | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('/bot')) return null;

  const parts = trimmed.split(' ');
  if (parts.length < 2) return null;

  const command = parts[1];
  
  // Handle set-persona command
  if (command === 'set-persona') {
    const parts = trimmed.split(' ');
    const botFlag = parts[2];
    
    if (!botFlag?.startsWith('--bot')) {
      throw new Error('Bot number must be specified using --botN flag');
    }
    
    const botNumber = parseInt(botFlag.slice(5));
    if (isNaN(botNumber) || botNumber < 1 || botNumber > 10) {
      throw new Error('Invalid bot number. Must be between 1 and 10.');
    }
    
    const persona = parts.slice(3).join(' ').replace(/^["']|["']$/g, '');
    if (!persona) {
      throw new Error('Persona must be specified');
    }

    return { command: 'set-persona', botId: botNumber, persona };
  }

  // Handle personas command
  if (command === 'personas') {
    return { command: 'personas' };
  }

  // Handle seed command with quoted prompt and optional parameters
  if (command === 'seed') {
    const content = parts.slice(2).join(' ');
    const promptMatch = content.match(/"([^"]+)"/);
    if (!promptMatch) {
      throw new Error('Prompt must be wrapped in quotes');
    }
    const prompt = promptMatch[1];
    
    // Look for --turns parameter
    const remainingContent = content.slice(promptMatch[0].length).trim();
    const turnsMatch = remainingContent.match(/--turns\s+(\d+)/);
    const num_turns = turnsMatch ? parseInt(turnsMatch[1], 10) : undefined;

    // Look for --bots parameter
    const botsMatch = remainingContent.match(/--bots\s+([0-9,\s]+)/);
    const bots = botsMatch ? 
      botsMatch[1]
        .split(',')
        .map(n => parseInt(n.trim()))
        .filter(n => !isNaN(n) && n >= 1 && n <= 10) : 
      undefined;

    return { command: 'seed', prompt, num_turns, bots };
  }

  // Handle list-bots command
  if (command === 'list-bots') {
    return { command: 'list-bots' };
  }

  // Handle enable-bot command
  if (command === 'enable-bot') {
    const botId = parseInt(parts[2]);
    if (isNaN(botId) || botId < 1 || botId > 10) {
      throw new Error('Invalid bot number. Must be between 1 and 10.');
    }
    return { command: 'enable-bot', botId };
  }

  // Handle disable-bot command
  if (command === 'disable-bot') {
    const botId = parseInt(parts[2]);
    if (isNaN(botId) || botId < 1 || botId > 10) {
      throw new Error('Invalid bot number. Must be between 1 and 10.');
    }
    return { command: 'disable-bot', botId };
  }

  // Handle summary command
  if (command === 'summary') {
    const prompt = parts.slice(2).join(' ').replace(/^["']|["']$/g, '');
    return { command: 'summary', prompt: prompt || undefined };
  }

  // Handle index command
  if (command === 'index') {
    return { command: 'index' };
  }

  // Handle reset-index command
  if (command === 'reset-index') {
    return { command: 'reset-index' };
  }

  throw new Error(`Unknown command: ${command}`);
}

// Helper types for command handlers
export interface CommandContext {
  channelId: string;
  supabase: ReturnType<typeof createClientComponentClient<Database>>;
  toast: (props: {
    title?: string;
    description: string;
    variant?: 'default' | 'destructive';
  }) => void;
}

// Helper function to insert system message
export async function insertSystemMessage(
  context: CommandContext,
  content: string,
  metadata: Record<string, unknown> = {}
) {
  return context.supabase
    .from('messages')
    .insert({
      channel_id: context.channelId,
      content,
      sender_id: '00000000-0000-0000-0000-000000000000', // System Bot
      type: 'text',
      metadata: {
        is_bot: true,
        bot_type: 'system',
        is_command_response: true,
        sender_name: 'System',
        ...metadata
      }
    });
}

// Helper function to get bot UUID
export function getBotUserId(botNumber: number): string {
  return `00000000-0000-0000-0000-000000000b${botNumber.toString().padStart(2, '0')}`;
} 