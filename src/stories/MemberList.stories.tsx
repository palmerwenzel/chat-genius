import type { Meta, StoryObj } from "@storybook/react";
import { MemberList } from "@/components/channels/MemberList";

const meta: Meta<typeof MemberList> = {
  title: "Channels/MemberList",
  component: MemberList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MemberList>;

export const Default: Story = {
  args: {
    channelId: "example-channel",
    members: [
      { id: "1", name: "John Doe", role: "owner", status: "online" },
      { id: "2", name: "Jane Smith", role: "admin", status: "idle" },
      { id: "3", name: "Bob Johnson", role: "member", status: "offline" },
    ],
  },
};

export const WithAvatars: Story = {
  args: {
    channelId: "example-channel",
    members: [
      { 
        id: "1", 
        name: "John Doe", 
        role: "owner", 
        status: "online",
        avatar: "https://github.com/shadcn.png",
      },
      { 
        id: "2", 
        name: "Jane Smith", 
        role: "admin", 
        status: "idle",
        avatar: "https://github.com/radix-ui.png",
      },
      { 
        id: "3", 
        name: "Bob Johnson", 
        role: "member", 
        status: "offline",
        avatar: "https://github.com/vercel.png",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    channelId: "example-channel",
    members: [],
  },
}; 