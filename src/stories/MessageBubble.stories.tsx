import type { Meta, StoryObj } from '@storybook/react';
import { MessageBubble } from '@/components/messages/MessageBubble';

const meta: Meta<typeof MessageBubble> = {
  title: 'Chat/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

const baseMessage = {
  id: '1',
  timestamp: '12:34 PM',
  sender: {
    id: '1',
    name: 'John Doe',
    status: 'Online',
    avatar: 'https://github.com/shadcn.png', // Example avatar
  },
};

export const TextMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'Hello! This is a regular text message.',
      type: 'text',
    },
  },
};

export const CodeMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'console.log("Hello, World!");\nconst x = 42;',
      type: 'code',
    },
  },
};

export const LinkMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'https://github.com/shadcn/ui',
      type: 'link',
    },
  },
};

export const ThreadMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'This message has a thread with replies',
      type: 'text',
      isThread: true,
      replyCount: 3,
    },
  },
};

export const CurrentUserMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'This is a message from the current user',
      type: 'text',
    },
    isCurrentUser: true,
  },
};

// Show all variations in one view
export const AllVariations: Story = {
  render: () => (
    <div className="space-y-4 p-4 max-w-2xl">
      <MessageBubble message={{
        ...baseMessage,
        content: 'Regular text message from another user',
        type: 'text',
      }} />
      
      <MessageBubble 
        message={{
          ...baseMessage,
          content: 'Message from current user',
          type: 'text',
        }}
        isCurrentUser={true}
      />

      <MessageBubble message={{
        ...baseMessage,
        content: 'console.log("Code message example");\nconst x = 42;',
        type: 'code',
      }} />

      <MessageBubble message={{
        ...baseMessage,
        content: 'https://github.com/shadcn/ui',
        type: 'link',
      }} />

      <MessageBubble message={{
        ...baseMessage,
        content: 'Message with thread',
        type: 'text',
        isThread: true,
        replyCount: 3,
      }} />
    </div>
  ),
}; 