import type { Meta, StoryObj } from "@storybook/react";
import { LinkPreview } from "@/components/messages/LinkPreview";

const meta: Meta<typeof LinkPreview> = {
  title: "Messages/LinkPreview",
  component: LinkPreview,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LinkPreview>;

export const Loading: Story = {
  args: {
    url: "https://example.com",
    isLoading: true,
  },
};

export const NoMetadata: Story = {
  args: {
    url: "https://example.com",
    isLoading: false,
  },
};

export const WithMetadata: Story = {
  args: {
    url: "https://github.com/cursor-ai",
    metadata: {
      title: "Cursor AI",
      description: "The AI-first code editor. Built for AI-powered development.",
      siteName: "GitHub",
      image: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    },
    isLoading: false,
  },
};

export const NoImage: Story = {
  args: {
    url: "https://example.com/article",
    metadata: {
      title: "Example Article",
      description: "This is an example article without an image preview.",
      siteName: "Example News",
    },
    isLoading: false,
  },
}; 