import type { Meta, StoryObj } from "@storybook/react";
import { ChatArea } from "@/components/chat/ChatArea";

const meta: Meta<typeof ChatArea> = {
  title: "Chat/ChatArea",
  component: ChatArea,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatArea>;

export const WithMessages: Story = {
  args: {},
};

export const Empty: Story = {
  args: {
    messages: [],
  },
}; 