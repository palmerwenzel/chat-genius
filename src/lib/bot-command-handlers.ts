import { BotCommand, CommandContext, insertSystemMessage, getBotUserId } from './bot-commands';

export async function handleBotCommand(
  command: BotCommand,
  context: CommandContext
): Promise<void> {
  try {
    switch (command.command) {
      case 'seed':
        await handleSeedCommand(command, context);
        break;

      case 'summary':
        await handleSummaryCommand(command, context);
        break;

      case 'index':
        await handleIndexCommand(context);
        break;

      case 'personas':
        await handlePersonasCommand(context);
        break;

      case 'set-persona':
        await handleSetPersonaCommand(command, context);
        break;

      case 'reset-index':
        await handleResetIndexCommand(context);
        break;

      case 'list-bots':
        await handleListBotsCommand(context);
        break;

      case 'enable-bot':
        await handleEnableBotCommand(command, context);
        break;

      case 'disable-bot':
        await handleDisableBotCommand(command, context);
        break;

      default:
        throw new Error(`Unknown command: ${(command as BotCommand).command}`);
    }
  } catch (error) {
    console.error('Error executing bot command:', error);
    context.toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to execute command',
      variant: 'destructive'
    });
  }
}

async function handleSeedCommand(command: Extract<BotCommand, { command: 'seed' }>, context: CommandContext) {
  // Show initial loading message
  await insertSystemMessage(context,
    "🤖 Generating conversation...\n" +
    "This might take a minute as the bots think about their responses.",
    { is_loading: true }
  );

  try {
    const response = await fetch('/api/ai/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: command.prompt,
        num_turns: command.num_turns || 3,
        bots: command.bots,
        channelId: context.channelId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to seed conversation');
    }

    const data = await response.json();
    
    // Remove loading message before inserting conversation
    await context.supabase
      .from('messages')
      .delete()
      .eq('channel_id', context.channelId)
      .eq('metadata->is_loading', true);
    
    // Insert each message into Supabase
    for (const message of data.messages) {
      const botNumber = parseInt(message.metadata.bot_id?.replace(/.*b(\d+)$/, '$1') || '0');
      const botUserId = getBotUserId(botNumber);

      await context.supabase
        .from('messages')
        .insert({
          channel_id: context.channelId,
          content: message.content,
          sender_id: botUserId,
          type: 'text',
          metadata: {
            ...message.metadata,
            is_bot: true,
            is_command_response: true,
            bot_number: botNumber,
            sender_name: message.metadata.bot_name || `Bot ${botNumber}`
          }
        });
    }

    context.toast({
      description: 'Conversation seeded successfully'
    });
  } catch (error) {
    // Remove loading message on error
    await context.supabase
      .from('messages')
      .delete()
      .eq('channel_id', context.channelId)
      .eq('metadata->is_loading', true);
    
    throw error;
  }
}

async function handleSummaryCommand(command: Extract<BotCommand, { command: 'summary' }>, context: CommandContext) {
  const { data: messages, error: messagesError } = await context.supabase
    .from('messages')
    .select('*')
    .eq('channel_id', context.channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;
  if (!messages.length) {
    throw new Error('No messages found in channel to summarize');
  }

  const response = await fetch('/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(msg => ({
        role: msg.metadata?.is_bot ? 'assistant' : 'user',
        content: msg.content,
        metadata: msg.metadata || {},
        channel_id: msg.channel_id,
        sender_id: msg.sender_id,
        created_at: msg.created_at
      })),
      query: command.prompt,
      filter: { channel_id: context.channelId }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate summary');
  }

  const data = await response.json();
  await insertSystemMessage(context, data.summary, { is_summary: true });
  
  context.toast({
    description: 'Summary generated and added to chat'
  });
}

async function handleIndexCommand(context: CommandContext) {
  const { data: messages, error: messagesError } = await context.supabase
    .from('messages')
    .select('content, sender_id, metadata')
    .eq('channel_id', context.channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;
  if (!messages?.length) {
    throw new Error('No messages found to index');
  }

  // Transform messages for RAG service
  const ragMessages = messages
    .filter(msg => !msg.metadata?.is_command_response)
    .map(msg => ({
      role: msg.metadata?.is_bot ? 'assistant' : 'user',
      content: msg.content,
      metadata: {
        ...msg.metadata,
        sender: msg.sender_id,
        type: 'channel_message'
      }
    }));

  console.log('Indexing messages:', ragMessages);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch('/api/ai/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: ragMessages }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to index messages');
    }

    const data = await response.json();
    console.log('Index response:', data);

    context.toast({
      title: 'Messages Indexed',
      description: `Successfully indexed ${messages.length} messages for RAG functionality.`
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Indexing operation timed out after 60 seconds. The operation may still complete in the background.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handlePersonasCommand(context: CommandContext) {
  const response = await fetch('/api/ai/personas', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to get personas');
  }

  const data = await response.json();
  const personas = data.personas || {};
  
  // Format each persona with its details
  const personasList = Object.entries(personas)
    .map(([botId, info]) => {
      const { name, role, persona } = info as { name: string; role: string; persona: string };
      return `Bot ${botId.replace('bot', '').replace('_persona', '')}:\n  Name: ${name}\n  Role: ${role}\n  Description: ${persona.split('\n')[0]}`; // Only show first line of description
    })
    .join('\n\n');

  if (!personasList) {
    await insertSystemMessage(context, 'No personas are currently set.');
    return;
  }

  await insertSystemMessage(context, 
    `Current personas:\n\`\`\`\n${personasList}\n\`\`\`\n\n`
  );

  context.toast({
    title: 'Current Personas',
    description: 'The current bot personas have been added to the chat.'
  });
}

async function handleSetPersonaCommand(
  command: Extract<BotCommand, { command: 'set-persona' }>,
  context: CommandContext
) {
  // Convert bot number to UUID format
  const uuid_bot_id = `00000000-0000-0000-0000-000000000b${command.botId.toString().padStart(2, '0')}`;

  const response = await fetch('/api/ai/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bot_id: uuid_bot_id,
      persona: command.persona
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update bot persona');
  }

  await insertSystemMessage(context,
    `Bot ${command.botId} persona updated to: ${command.persona}\n\n` +
    'Note: Use /bot reset-index to clear the message index before starting a new conversation.'
  );

  context.toast({
    title: 'Persona Updated',
    description: 'The bot persona has been updated. Remember to reset the index.'
  });
}

async function handleResetIndexCommand(context: CommandContext) {
  const response = await fetch('/api/ai/index/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to reset index');
  }

  await insertSystemMessage(context,
    'Message index has been reset. You can now start a new conversation with different personas.'
  );

  context.toast({
    title: 'Index Reset',
    description: 'The message index has been cleared.'
  });
}

async function handleListBotsCommand(context: CommandContext) {
  const response = await fetch('/api/ai/personas', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to get bot information');
  }

  const data = await response.json();
  const botList = Object.entries(data.personas)
    .map(([botId, info]) => {
      const { name, role } = info as { name: string; role: string };
      const botNumber = botId.replace('bot', '').replace('_persona', '');
      const isEnabled = data.enabled_bots?.includes(parseInt(botNumber));
      return `Bot ${botNumber}${isEnabled ? ' (Enabled)' : ' (Disabled)'}: ${name} - ${role}`;
    })
    .join('\n');

  await insertSystemMessage(context,
    `Available Bots:\n${botList}\n\n` +
    'Use /bot enable-bot <number> or /bot disable-bot <number> to manage bots.'
  );

  context.toast({
    title: 'Bot List',
    description: 'The list of available bots has been added to the chat.'
  });
}

async function handleEnableBotCommand(
  command: Extract<BotCommand, { command: 'enable-bot' }>,
  context: CommandContext
) {
  const response = await fetch('/api/ai/personas/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botId: command.botId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to enable bot');
  }

  await insertSystemMessage(context, `Bot ${command.botId} has been enabled.`);

  context.toast({
    title: 'Bot Enabled',
    description: `Bot ${command.botId} has been enabled and can now participate in conversations.`
  });
}

async function handleDisableBotCommand(
  command: Extract<BotCommand, { command: 'disable-bot' }>,
  context: CommandContext
) {
  const response = await fetch('/api/ai/personas/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botId: command.botId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to disable bot');
  }

  await insertSystemMessage(context, `Bot ${command.botId} has been disabled.`);

  context.toast({
    title: 'Bot Disabled',
    description: `Bot ${command.botId} has been disabled and will not participate in conversations.`
  });
} 