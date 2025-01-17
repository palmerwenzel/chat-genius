'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MessageInput } from "@/components/messages/MessageInput";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/stores/auth';
import { useChatContext } from '@/contexts/chat';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { storageService } from '@/services/storage';
import { TypingIndicator } from '@/components/presence/TypingIndicator';

interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  groupId: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

// Helper function to parse bot commands
interface BotCommand {
  command: string;
  prompt?: string;
  num_turns?: number;
}

interface SetPersonasCommand extends BotCommand {
  command: 'set-personas';
  bot1_persona: string;
  bot2_persona: string;
}

type ParsedCommand = BotCommand | SetPersonasCommand;

function parseBotCommand(content: string): ParsedCommand | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('@bot')) return null;

  const parts = trimmed.split(' ');
  if (parts.length < 2) return null;

  const command = parts[1];
  
  // Handle set-personas command
  if (command === 'set-personas') {
    const bot1Index = parts.indexOf('--bot1');
    const bot2Index = parts.indexOf('--bot2');
    
    if (bot1Index === -1 || bot2Index === -1) {
      throw new Error('Both --bot1 and --bot2 are required for setting personas');
    }

    const bot1End = bot2Index !== -1 ? bot2Index : parts.length;
    const bot2End = parts.length;

    const bot1_persona = parts.slice(bot1Index + 1, bot1End).join(' ').replace(/^["']|["']$/g, '');
    const bot2_persona = parts.slice(bot2Index + 1, bot2End).join(' ').replace(/^["']|["']$/g, '');

    return { command: 'set-personas', bot1_persona, bot2_persona };
  }

  // Handle personas command
  if (command === 'personas') {
    return { command: 'personas' };
  }

  // Handle seed command with quoted prompt and optional num_turns
  if (command === 'seed') {
    const content = parts.slice(2).join(' ');
    const promptMatch = content.match(/"([^"]+)"/);
    if (!promptMatch) {
      throw new Error('Prompt must be wrapped in quotes');
    }
    const prompt = promptMatch[1];
    
    // Look for --turns parameter after the quoted prompt
    const remainingContent = content.slice(promptMatch[0].length).trim();
    const turnsMatch = remainingContent.match(/--turns\s+(\d+)/);
    const num_turns = turnsMatch ? parseInt(turnsMatch[1], 10) : undefined;

    return { command, prompt, num_turns };
  }

  // Handle other commands
  const prompt = parts.slice(2).join(' ').replace(/^["']|["']$/g, '');
  return { command, prompt };
}

const supabase = createClientComponentClient<Database>();

const BOT_1_ID = process.env.BOT_USER_1_ID || '00000000-0000-0000-0000-000000000b01';
const BOT_2_ID = process.env.BOT_USER_2_ID || '00000000-0000-0000-0000-000000000b02';
const SYSTEM_BOT_ID = process.env.SYSTEM_BOT_ID || '00000000-0000-0000-0000-000000000000';

export function ChatInterface({
  title,
  subtitle,
  channelId,
  groupId,
  isLoading,
  children,
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { replyTo, setReplyTo } = useChatContext();
  const messageInputRef = React.useRef<{ focus: () => void }>(null);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  const scrollToMessage = React.useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Focus input when replying
  React.useEffect(() => {
    if (replyTo) {
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  }, [replyTo]);

  // Subscribe to typing status changes
  React.useEffect(() => {
    if (!channelId || !user) return;

    const fetchTypingUsers = async () => {
      const { data: typingData } = await supabase
        .from('channel_typing')
        .select(`
          user_id,
          users (
            name
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_typing', true)
        .neq('user_id', user.id); // Don't show current user

      const typingUserNames = (typingData as TypingData[] | null)
        ?.filter(d => d.users !== null)
        .map(d => d.users!.name) || [];

      setTypingUsers(typingUserNames);
    };

    // Fetch initial state
    fetchTypingUsers();

    type TypingData = {
      user_id: string;
      users: Database['public']['Tables']['users']['Row'] | null;
    };

    // Subscribe to changes
    const channel = supabase.channel(`typing:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_typing',
        filter: `channel_id=eq.${channelId}`,
      }, () => {
        // Refetch typing users when changes occur
        fetchTypingUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, user]);

  async function handleSendMessage(content: string, type: 'text' | 'code', attachments?: File[], replyTo?: { id: string; content: string; author: string }) {
    try {
      // Handle bot commands
      const botCommand = parseBotCommand(content);
      if (botCommand) {
        if (botCommand.command === 'seed' && botCommand.prompt) {
          const response = await fetch('/api/ai/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: botCommand.prompt,
              num_turns: botCommand.num_turns || 3,
              channelId
            })
          });

          if (!response.ok) {
            throw new Error('Failed to seed conversation');
          }

          const { messages } = await response.json();
          // Add seeded messages to the chat
          for (const message of messages) {
            const botNumber = message.metadata.bot_number;
            const botUserId = botNumber === 1 
              ? BOT_1_ID  // Bot 1
              : BOT_2_ID; // Bot 2

            await supabase
              .from('messages')
              .insert({
                channel_id: channelId,
                content: message.content,
                sender_id: botUserId,
                type: 'text',
                metadata: {
                  ...message.metadata,
                  is_bot: true,
                  is_command_response: true,
                  bot_number: botNumber,
                  sender_name: `Bot ${botNumber}`
                }
              });
          }
        } else if (botCommand.command === 'summary') {
          try {
            const messages = await supabase
              .from('messages')
              .select('*')
              .eq('channel_id', channelId)
              .is('deleted_at', null)
              .order('created_at', { ascending: true });

            if (messages.error) throw messages.error;
            if (!messages.data.length) {
              toast({
                variant: "destructive",
                description: 'No messages found in channel to summarize'
              });
              return;
            }

            console.log(`Generating summary for ${messages.data.length} messages`);
            const response = await fetch('/api/ai/summary', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: messages.data.map(msg => ({
                  role: msg.metadata?.is_bot ? 'assistant' : 'user',
                  content: msg.content,
                  metadata: msg.metadata || {},
                  channel_id: msg.channel_id,
                  sender_id: msg.sender_id,
                  created_at: msg.created_at
                })),
                query: botCommand.prompt,
                filter: {
                  channel_id: channelId,
                }
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to generate summary');
            }

            const data = await response.json();
            
            // Insert the summary as a system bot message
            const { error: insertError } = await supabase
              .from('messages')
              .insert({
                channel_id: channelId,
                content: data.summary,
                type: 'text',
                sender_id: SYSTEM_BOT_ID, // System Bot for system messages
                metadata: {
                  is_bot: true,
                  bot_type: 'system',
                  sender_name: 'System',
                  is_summary: true
                }
              });

            if (insertError) throw insertError;
            toast({
              description: 'Summary generated and added to chat'
            });
          } catch (error) {
            console.error('Error in summary generation:', error);
            toast({
              variant: "destructive",
              description: error instanceof Error ? error.message : 'Failed to generate summary'
            });
          }
          return;
        } else if (botCommand.command === 'index') {
          // Fetch channel messages
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('content, sender_id, metadata')
            .eq('channel_id', channelId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            throw new Error('Failed to fetch channel messages');
          }

          if (!messages?.length) {
            throw new Error('No messages found to index');
          }

          console.log('Preparing to index messages:', {
            count: messages.length,
            channelId
          });

          // Transform messages for RAG service
          const ragMessages = messages
            .filter(msg => !msg.metadata?.is_command_response) // Filter out command responses
            .map(msg => ({
              role: msg.metadata?.is_bot ? 'assistant' : 'user',
              content: msg.content,
              metadata: {
                ...msg.metadata,
                sender: msg.sender_id,
                type: 'channel_message'
              }
            }));

          // Call RAG service to index messages
          const response = await fetch('/api/ai/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: ragMessages })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('Error from index endpoint:', {
              status: response.status,
              error: errorData
            });
            throw new Error(errorData?.error || 'Failed to index messages');
          }

          const data = await response.json();
          console.log('Indexing response:', data);

          toast({
            title: 'Messages Indexed',
            description: `Successfully indexed ${messages.length} messages for RAG functionality.`,
          });
        } else if (botCommand.command === 'personas') {
          // Get current personas
          const response = await fetch('/api/ai/personas', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to get personas');
          }

          const data = await response.json();
          
          // Add personas as a bot message
          await supabase
            .from('messages')
            .insert({
              channel_id: channelId,
              content: `Current personas:\nBot 1: ${data.bot1_persona}\nBot 2: ${data.bot2_persona}`,
              sender_id: SYSTEM_BOT_ID, // System Bot for system messages
              type: 'text',
              metadata: {
                is_bot: true,
                is_system: true,
                is_command_response: true,
                sender_name: 'System'
              }
            });

          toast({
            title: 'Current Personas',
            description: 'The current bot personas have been added to the chat.',
          });
        } else if (botCommand.command === 'set-personas' && 'bot1_persona' in botCommand) {
          // Set new personas
          const response = await fetch('/api/ai/personas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bot1_persona: botCommand.bot1_persona,
              bot2_persona: botCommand.bot2_persona
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to set personas');
          }

          // Add confirmation as a bot message
          await supabase
            .from('messages')
            .insert({
              channel_id: channelId,
              content: `Personas updated:\nBot 1: ${botCommand.bot1_persona}\nBot 2: ${botCommand.bot2_persona}\n\nNote: Use @bot reset-index to clear the message index before starting a new conversation.`,
              sender_id: SYSTEM_BOT_ID, // System Bot for system messages
              type: 'text',
              metadata: {
                is_bot: true,
                is_system: true,
                is_command_response: true,
                sender_name: 'System'
              }
            });

          toast({
            title: 'Personas Updated',
            description: 'The bot personas have been updated. Remember to reset the index.',
          });
        } else if (botCommand.command === 'reset-index') {
          // Reset the message index
          const response = await fetch('/api/ai/index/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to reset index');
          }

          // Add confirmation as a bot message
          await supabase
            .from('messages')
            .insert({
              channel_id: channelId,
              content: 'Message index has been reset. You can now start a new conversation with different personas.',
              sender_id: SYSTEM_BOT_ID, // System Bot for system messages
              type: 'text',
              metadata: {
                is_bot: true,
                is_system: true,
                is_command_response: true,
                sender_name: 'System'
              }
            });

          toast({
            title: 'Index Reset',
            description: 'The message index has been cleared.',
          });
        }
        return;
      }

      // If not a bot command, proceed with normal message sending
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: user?.id,
          content,
          type,
          replying_to_id: replyTo?.id,
          metadata: attachments ? { 
            files: attachments.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type
            }))
          } : {}
        })
        .select()
        .single();

      if (messageError) {
        // If it's an auth error, redirect to login
        if (messageError.code === 'PGRST301' || messageError.message?.includes('auth')) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to send messages.',
            variant: 'destructive',
          });
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        throw messageError;
      }

      // If there are attachments, upload them
      if (attachments?.length) {
        const uploadedFiles = await Promise.all(
          attachments.map(async (file) => {
            const publicUrl = await storageService.uploadFile('attachments', file, {
              name: file.name,
              size: file.size,
              mimeType: file.type,
              channelId,
              groupId,
              messageId: message.id
            }, user!.id);

            if (!publicUrl) {
              throw new Error('Failed to upload file');
            }

            return {
              url: publicUrl,
              type: file.type,
              name: file.name,
              size: file.size
            };
          })
        );

        // Update the message with file metadata
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            metadata: {
              files: uploadedFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url
              }))
            }
          })
          .eq('id', message.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto transition-[padding] duration-150 flex flex-col min-h-0">
        <div className="flex-1">
          {children}
        </div>
        {typingUsers.length > 0 && (
          <div className="px-6 py-2">
            <TypingIndicator users={typingUsers} />
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <MessageInput
          ref={messageInputRef}
          onSend={handleSendMessage}
          disabled={isLoading}
          replyTo={replyTo || undefined}
          onCancelReply={() => setReplyTo(null)}
          onNavigateToMessage={scrollToMessage}
          channelId={channelId}
        />
      </div>
    </div>
  );
} 