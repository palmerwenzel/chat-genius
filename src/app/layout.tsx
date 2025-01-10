import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Surface } from "@/components/ui/surface";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatGenius",
  description: "An AI-powered chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <Surface className="min-h-screen">
            {children}
          </Surface>
        </ThemeProvider>
      </body>
    </html>
  );
}
