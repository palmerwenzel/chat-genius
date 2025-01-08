import type { Meta, StoryObj } from '@storybook/react';
import { CreateChannelModal } from '@/components/channels/CreateChannelModal';

const meta: Meta<typeof CreateChannelModal> = {
  title: 'Channels/CreateChannelModal',
  component: CreateChannelModal,
  parameters: {
    layout: 'centered',
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof CreateChannelModal>;

export const Default: Story = {}; 