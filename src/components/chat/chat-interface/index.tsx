import { ChatInterface } from './client';

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  /** Required for routing and future group-specific features */
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
      groupId={groupId}
    >
      {children}
    </ChatInterface>
  );
}

export { ChatInterface }; 