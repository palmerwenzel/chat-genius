import type { Meta, StoryObj } from '@storybook/react';
import ChatPage from '@/app/(chat)/chat/page';

const meta: Meta<typeof ChatPage> = {
  title: 'Pages/ChatPage',
  component: ChatPage,
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
type Story = StoryObj<typeof ChatPage>;

export const Default: Story = {
  args: {},
}; 