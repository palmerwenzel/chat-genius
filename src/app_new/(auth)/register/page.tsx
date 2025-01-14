import { Register } from "@/components/auth/register";

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="container flex h-screen w-screen flex-col items-center justify-center">
      <Register searchParams={searchParams} />
    </main>
  );
} 