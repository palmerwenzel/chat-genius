import type { Meta, StoryObj } from "@storybook/react";
import ProfilePage from "@/app/(auth)/profile/page";
import { withPageLayout } from "./decorators/withPageLayout";

const meta: Meta<typeof ProfilePage> = {
  title: "Pages/ProfilePage",
  component: ProfilePage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Profile page where users can view and edit their profile information.",
      },
    },
  },
  decorators: [withPageLayout],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {
  args: {},
}; 