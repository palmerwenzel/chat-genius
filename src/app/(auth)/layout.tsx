export default function AuthLayout({ children }: { children: React.ReactNode }) {
    // This layout can wrap all auth pages
    return (
      <section className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        {children}
      </section>
    );
  }