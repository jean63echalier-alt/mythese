import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link
            href="/app"
            className="font-serif text-2xl font-semibold text-[var(--color-burgundy)]"
          >
            Mythèse
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--color-ink-muted)] hidden md:block">
              {user.email}
            </span>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
