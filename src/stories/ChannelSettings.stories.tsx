import type { Meta, StoryObj } from '@storybook/react';
import { ChannelSettings } from '@/components/channels/ChannelSettings';

type MemberRole = "owner" | "admin" | "member";
type MemberStatus = "online" | "idle" | "offline";

interface Member {
  id: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  avatar?: string;
}

const meta: Meta<typeof ChannelSettings> = {
  title: 'Channels/ChannelSettings',
  component: ChannelSettings,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChannelSettings>;

const mockMembers: Member[] = [
  { id: '1', name: 'John Doe', role: 'owner', status: 'online', avatar: 'https://github.com/shadcn.png' },
  { id: '2', name: 'Jane Smith', role: 'admin', status: 'idle', avatar: 'https://github.com/radix-ui.png' },
  { id: '3', name: 'Bob Johnson', role: 'member', status: 'offline' },
];

export const Default: Story = {
  args: {
    isOpen: true,
    channel: {
      id: 'general',
      name: 'general',
      topic: 'General discussion',
      members: mockMembers,
    },
  },
};

export const NoTopic: Story = {
  args: {
    isOpen: true,
    channel: {
      id: 'random',
      name: 'random',
      members: mockMembers,
    },
  },
};

export const PrivateChannel: Story = {
  args: {
    isOpen: true,
    channel: {
      id: 'private-team',
      name: 'private-team',
      topic: 'Private team discussions',
      isPrivate: true,
      members: mockMembers,
    },
  },
};

export const EmptyChannel: Story = {
  args: {
    isOpen: true,
    channel: {
      id: 'empty',
      name: 'empty',
      members: [],
    },
  },
}; 