import type { Meta, StoryObj } from '@storybook/react';
import { CreateChannelDialog } from '@/components/channels/CreateChannelDialog';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof CreateChannelDialog> = {
  title: 'Channels/CreateChannelDialog',
  component: CreateChannelDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CreateChannelDialog>;

export const Default: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Channel created:', data);
    },
  },
};

export const WithCustomTrigger: Story = {
  args: {
    trigger: <Button variant="outline">Create New Channel</Button>,
    onSubmit: (data) => {
      console.log('Channel created:', data);
    },
  },
}; 