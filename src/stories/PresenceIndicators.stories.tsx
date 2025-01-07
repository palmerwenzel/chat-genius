import type { Meta, StoryObj } from '@storybook/react';
import { PresenceIndicator, type PresenceStatus } from '@/components/presence/PresenceIndicator';
import { TypingIndicator } from '@/components/presence/TypingIndicator';

const meta: Meta = {
  title: 'Chat/Presence',
  component: PresenceIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Status: Story = {
  render: () => {
    const statuses: PresenceStatus[] = ['online', 'idle', 'dnd', 'offline'];
    
    return (
      <div className="flex flex-col gap-8">
        {/* Status badges with labels */}
        <div className="flex items-center gap-8">
          {statuses.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <PresenceIndicator status={status} />
              <span className="text-sm capitalize">{status}</span>
            </div>
          ))}
        </div>

        {/* Status badges without tooltips */}
        <div className="flex items-center gap-4">
          {statuses.map((status) => (
            <PresenceIndicator 
              key={status} 
              status={status} 
              showTooltip={false}
            />
          ))}
        </div>

        {/* Status badges with custom sizes */}
        <div className="flex items-center gap-4">
          {statuses.map((status) => (
            <PresenceIndicator 
              key={status} 
              status={status} 
              className="h-4 w-4"
            />
          ))}
        </div>
      </div>
    );
  },
};

export const TypingStates: Story = {
  render: () => (
    <div className="space-y-4 min-w-[300px] p-4 border rounded-lg">
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-4">Single User</h3>
        <TypingIndicator users={['John Doe']} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-4">Two Users</h3>
        <TypingIndicator users={['John Doe', 'Jane Smith']} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-4">Three Users</h3>
        <TypingIndicator users={['John Doe', 'Jane Smith', 'Bob Wilson']} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-4">Many Users</h3>
        <TypingIndicator 
          users={[
            'John Doe',
            'Jane Smith',
            'Bob Wilson',
            'Alice Brown',
          ]} 
        />
      </div>
    </div>
  ),
}; 