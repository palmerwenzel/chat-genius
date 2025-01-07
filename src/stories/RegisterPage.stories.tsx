import type { Meta, StoryObj } from "@storybook/react";
import RegisterPage from "@/app/(auth)/register/page";

const meta: Meta<typeof RegisterPage> = {
  title: "Pages/RegisterPage",
  component: RegisterPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RegisterPage>;

export const Default: Story = {
  args: {},
}; 