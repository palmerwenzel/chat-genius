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

      case 'set-personas':
        await handleSetPersonasCommand(command, context);
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

  const { messages } = await response.json();
  
  // Add seeded messages to the chat
  for (const message of messages) {
    const botNumber = message.metadata.bot_number;
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

  const response = await fetch('/api/ai/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: ragMessages })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to index messages');
  }

  context.toast({
    title: 'Messages Indexed',
    description: `Successfully indexed ${messages.length} messages for RAG functionality.`
  });
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
  
  // Handle both old and new response formats
  const personas = data.personas || {};
  const enabledBots = data.enabled_bots || [];
  
  // Convert personas object to array of strings
  const personasList = Object.entries(personas)
    .map(([botId, persona]) => `Bot ${botId}: ${persona}`)
    .join('\n');

  if (!personasList) {
    await insertSystemMessage(context, 'No personas are currently set.');
    return;
  }

  await insertSystemMessage(context, 
    `Current personas:\n${personasList}\n\n` +
    `Enabled bots: ${enabledBots.length ? enabledBots.join(', ') : 'None'}`
  );

  context.toast({
    title: 'Current Personas',
    description: 'The current bot personas have been added to the chat.'
  });
}

async function handleSetPersonasCommand(
  command: Extract<BotCommand, { command: 'set-personas' }>,
  context: CommandContext
) {
  if (!command.personas.length) {
    throw new Error('At least one bot persona must be specified');
  }

  // Convert personas array to the expected format with botN_persona keys
  const personasObject = command.personas.reduce((acc, { botId, persona }) => ({
    ...acc,
    [`bot${botId}_persona`]: persona
  }), {});

  const response = await fetch('/api/ai/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personas: personasObject })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update bot personas');
  }

  // Format the updated personas for display
  const personasList = command.personas
    .map(({ botId, persona }) => `Bot ${botId}: ${persona}`)
    .join('\n');

  await insertSystemMessage(context,
    `Personas updated:\n${personasList}\n\n` +
    'Note: Use @bot reset-index to clear the message index before starting a new conversation.'
  );

  context.toast({
    title: 'Personas Updated',
    description: 'The bot personas have been updated. Remember to reset the index.'
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
    .map(([botId, persona]) => {
      const isEnabled = data.enabled_bots.includes(parseInt(botId));
      return `Bot ${botId}${isEnabled ? ' (Enabled)' : ' (Disabled)'}: ${persona}`;
    })
    .join('\n');

  await insertSystemMessage(context,
    `Available Bots:\n${botList}\n\n` +
    'Use @bot enable-bot <number> or @bot disable-bot <number> to manage bots.'
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