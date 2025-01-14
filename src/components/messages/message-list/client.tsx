"use client";

import { ReactNode } from "react";

export function MessageList({
  channelId,
  children,
}: {
  channelId: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col h-full">
      <h2 className="p-2 font-semibold border-b border-gray-300">
        Messages in Channel {channelId}
      </h2>
      {children}
    </section>
  );
}