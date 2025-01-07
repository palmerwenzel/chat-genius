import type { Meta, StoryObj } from "@storybook/react";
import NotFound from "@/app/not-found";

const meta: Meta<typeof NotFound> = {
  title: "Pages/NotFoundPage",
  component: NotFound,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "404 Not Found page shown when a route doesn't exist or can't be found.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof NotFound>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Default 404 page with a link to return to the home page.",
      },
    },
  },
}; 