import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ComponentType, ReactElement } from "react";

const inter = Inter({ subsets: ["latin"] });

export const withPageLayout = (Story: ComponentType): ReactElement => (
  <div className={inter.className}>
    <div className="min-h-screen bg-background">
      <Story />
    </div>
  </div>
); 