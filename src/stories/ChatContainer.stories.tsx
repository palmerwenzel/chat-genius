import type { Meta, StoryObj } from '@storybook/react';
import { ChatInterface } from '@/components/chat/ChatInterface';

const meta: Meta<typeof ChatInterface> = {
  title: 'Chat/ChatInterface',
  component: ChatInterface,
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'Example Channel',
    subtitle: 'A place to chat',
    channelId: '123',
    children: <div className="p-4">Message content goes here</div>
  },
};

export default meta;
type Story = StoryObj<typeof ChatInterface>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const NoChannel: Story = {
  args: {
    channelId: '',
    title: 'Select a Channel',
    subtitle: 'Choose a channel to start chatting',
  },
}; 