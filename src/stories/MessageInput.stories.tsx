import type { Meta, StoryObj } from '@storybook/react';
import { MessageInput } from '@/components/messages/MessageInput';

const meta: Meta<typeof MessageInput> = {
  title: 'Chat/MessageInput',
  component: MessageInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageInput>;

export const Default: Story = {
  args: {
    placeholder: 'Type a message...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Channel is read-only',
    disabled: true,
  },
};

// Interactive demo with console logging
export const Interactive: Story = {
  args: {
    onSend: (content, type) => {
      console.log('Message sent:', { content, type });
    },
  },
};

// Show in a chat-like container
export const InChatContext: Story = {
  decorators: [
    (Story) => (
      <div className="border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-muted/50">
          <h3 className="font-semibold"># general</h3>
        </div>
        <div className="h-[300px] bg-background" />
        <Story />
      </div>
    ),
  ],
}; 