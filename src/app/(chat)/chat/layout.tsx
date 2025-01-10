export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b px-4 flex items-center">
        </header>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
} 