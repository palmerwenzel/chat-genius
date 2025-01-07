import type { Meta, StoryObj } from '@storybook/react';
import { MemberManagement } from '@/components/channels/MemberManagement';

const meta: Meta<typeof MemberManagement> = {
  title: 'Channels/MemberManagement',
  component: MemberManagement,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="p-6 max-w-2xl border rounded-lg">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MemberManagement>;

export const Default: Story = {};

// The component already has internal state with example members
export const WithSearch: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Try searching for members using the search input.',
      },
    },
  },
}; 