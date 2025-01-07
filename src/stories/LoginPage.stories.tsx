import type { Meta, StoryObj } from "@storybook/react";
import LoginPage from "@/app/(auth)/login/page";
import { withPageLayout } from "./decorators/withPageLayout";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/LoginPage",
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Login page with authentication form.",
      },
    },
  },
  decorators: [withPageLayout],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {
  args: {},
}; 