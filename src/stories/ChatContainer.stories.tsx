import type { Meta, StoryObj } from '@storybook/react';
import { ChatContainer } from '@/components/chat/ChatContainer';

const meta: Meta<typeof ChatContainer> = {
  title: 'Chat/ChatContainer',
  component: ChatContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] flex flex-col bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatContainer>;

const sampleMessages = [
  {
    id: '1',
    content: 'Hello! Welcome to ChatGenius.',
    sender: {
      id: 'user1',
      name: 'Alice',
      avatar: 'https://github.com/shadcn.png',
    },
    timestamp: '10:00 AM',
  },
  {
    id: '2',
    content: 'Thanks! This is a great chat app.',
    sender: {
      id: 'user2',
      name: 'Bob',
      avatar: 'https://github.com/radix-ui.png',
    },
    timestamp: '10:01 AM',
  },
  {
    id: '3',
    content: 'I love the clean interface!',
    sender: {
      id: 'user3',
      name: 'Carol',
    },
    timestamp: '10:02 AM',
  },
];

export const WithMessages: Story = {
  args: {
    messages: sampleMessages,
  },
};

export const Empty: Story = {
  args: {
    messages: [],
  },
}; 