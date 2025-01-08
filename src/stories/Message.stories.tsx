import type { Meta, StoryObj } from '@storybook/react';
import { Message } from '@/components/messages/Message';

const baseMessage = {
  id: '1',
  channel_id: '123',
  user_id: 'user1',
  content: 'Hello! This is a test message.',
  type: 'text' as const,
  created_at: new Date().toISOString(),
  updated_at: null,
  parent_id: null,
  is_edited: false,
  attachments: null,
  sender: {
    id: 'user1',
    name: 'Alice',
    avatar_url: 'https://github.com/shadcn.png',
    email: 'alice@example.com'
  }
};

const meta: Meta<typeof Message> = {
  title: 'Messages/Message',
  component: Message,
  parameters: {
    layout: 'centered',
  },
  args: {
    message: baseMessage
  },
};

export default meta;
type Story = StoryObj<typeof Message>;

export const Default: Story = {};

export const WithCode: Story = {
  args: {
    message: {
      ...baseMessage,
      content: '```js\nconsole.log("Hello World");\n```',
      type: 'code' as const
    }
  }
};

export const WithLongMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'This is a very long message that should wrap to multiple lines. '.repeat(5)
    }
  }
}; 