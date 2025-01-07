import type { Meta, StoryObj } from '@storybook/react';
import { ChannelList } from '@/components/channels/ChannelList';

const meta: Meta<typeof ChannelList> = {
  title: 'Channels/ChannelList',
  component: ChannelList,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-64 border-r bg-background">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChannelList>;

export const Default: Story = {};

export const WithUnreadMessages: Story = {
  args: {
    // The component already has internal state with unread messages
  },
}; 