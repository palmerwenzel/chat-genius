import { getMessages, getMessageById } from './actions';
import { MessagesContainer } from './client';

interface MessagesContainerProps {
  channelId: string;
  highlightMessageId?: string;
}

export async function MessagesContainerServer({ channelId, highlightMessageId }: MessagesContainerProps) {
  // Get initial messages
  const messages = await getMessages(channelId);
  
  // Get highlighted message if it's not in the initial set
  let highlightedMessage = undefined;
  if (highlightMessageId && !messages.find(m => m.id === highlightMessageId)) {
    highlightedMessage = await getMessageById(highlightMessageId);
  }

  return (
    <MessagesContainer
      channelId={channelId}
      initialMessages={messages}
      highlightMessageId={highlightMessageId}
      highlightedMessage={highlightedMessage}
    />
  );
}

export { MessagesContainer } from './client';
