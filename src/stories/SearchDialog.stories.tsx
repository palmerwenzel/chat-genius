import type { Meta, StoryObj } from '@storybook/react';
import { SearchDialog } from '@/components/search/SearchDialog';
import { Hash, User, MessageSquare, FileText } from 'lucide-react';

const meta: Meta<typeof SearchDialog> = {
  title: 'Components/Search/SearchDialog',
  component: SearchDialog,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SearchDialog>;

const mockResults = [
  {
    id: '1',
    type: 'channel',
    title: '#general',
    subtitle: 'General discussion channel',
    icon: <Hash className="h-4 w-4" />,
  },
  {
    id: '2',
    type: 'user',
    title: 'John Doe',
    subtitle: '@johndoe',
    icon: <User className="h-4 w-4" />,
  },
  {
    id: '3',
    type: 'message',
    title: 'Meeting notes from yesterday',
    subtitle: 'in #team-updates',
    timestamp: '2:34 PM',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: '4',
    type: 'file',
    title: 'Q4 Report.pdf',
    subtitle: 'Shared in #reports',
    timestamp: 'Yesterday',
    icon: <FileText className="h-4 w-4" />,
  },
];

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onResultSelect: (result) => console.log('Selected:', result),
  },
  parameters: {
    mockData: mockResults,
  },
}; 