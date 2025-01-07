import type { Meta, StoryObj } from "@storybook/react";
import { EmojiReactions } from "@/components/messages/EmojiReactions";

const meta: Meta<typeof EmojiReactions> = {
  title: "Messages/EmojiReactions",
  component: EmojiReactions,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiReactions>;

export const NoReactions: Story = {
  args: {
    reactions: [],
    currentUserId: "user1",
    onReact: (emoji) => {
      console.log("Reacted with:", emoji);
    },
  },
};

export const SingleReaction: Story = {
  args: {
    reactions: [
      {
        emoji: "👍",
        count: 1,
        users: ["user2"],
      },
    ],
    currentUserId: "user1",
    onReact: (emoji) => {
      console.log("Reacted with:", emoji);
    },
  },
};

export const MultipleReactions: Story = {
  args: {
    reactions: [
      {
        emoji: "👍",
        count: 2,
        users: ["user1", "user2"],
      },
      {
        emoji: "❤️",
        count: 1,
        users: ["user3"],
      },
      {
        emoji: "😂",
        count: 3,
        users: ["user1", "user4", "user5"],
      },
    ],
    currentUserId: "user1",
    onReact: (emoji) => {
      console.log("Reacted with:", emoji);
    },
  },
};

export const UserReacted: Story = {
  args: {
    reactions: [
      {
        emoji: "👍",
        count: 1,
        users: ["user1"],
      },
      {
        emoji: "🎉",
        count: 2,
        users: ["user2", "user3"],
      },
    ],
    currentUserId: "user1",
    onReact: (emoji) => {
      console.log("Reacted with:", emoji);
    },
  },
}; 