import { Login } from "@/components/auth/login";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="container flex h-screen w-screen flex-col items-center justify-center">
      <Login searchParams={searchParams} />
    </main>
  );
}