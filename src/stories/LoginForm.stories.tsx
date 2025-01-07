import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { withPageLayout } from "./decorators/withPageLayout";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  decorators: [
    (Story) => withPageLayout(() => (
      <div className="flex items-center justify-center min-h-screen">
        <Story />
      </div>
    ))
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Login form component with email and password fields.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithHandlers: Story = {
  args: {
    onSubmit: (email: string) => {
      alert(`Login attempt with email: ${email}`);
    },
  },
}; 