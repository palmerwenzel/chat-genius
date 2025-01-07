import React from "react";
import type { Preview } from "@storybook/react";
import "../src/app/globals.css";
import { ThemeProvider } from "../src/providers/theme-provider";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <div className="dark">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview; 