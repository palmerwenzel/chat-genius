import { ChatInterface } from './client';

interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  groupId: string;
  children?: React.ReactNode;
}

export async function ChatInterfaceServer({
  title,
  subtitle,
  channelId,
  groupId,
  children,
}: ChatInterfaceProps) {
  return (
    <ChatInterface
      title={title}
      subtitle={subtitle}
      channelId={channelId}
    >
      {children}
    </ChatInterface>
  );
}

export { ChatInterface }; 