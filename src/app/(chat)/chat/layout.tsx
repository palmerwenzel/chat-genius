export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
} 