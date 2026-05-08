import Link from "next/link";
import { LoginForm } from "./_form";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Connexion — Mythese" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(sp.next || "/app");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="max-w-6xl mx-auto px-5 py-4">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold text-[var(--color-burgundy)]"
          >
            Mythèse
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <h1 className="font-serif text-3xl font-semibold text-center mb-2">
            Connexion
          </h1>
          <p className="text-center text-sm text-[var(--color-ink-soft)] mb-8">
            Reçois un lien magique par email pour entrer sans mot de passe.
          </p>

          {sp.sent && (
            <div className="mb-6 rounded-md border border-[var(--color-line)] bg-[var(--color-cream)] p-4 text-sm">
              <strong>✓ Lien envoyé.</strong> Va voir tes emails (vérifie aussi les spams).
            </div>
          )}

          {sp.error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {decodeURIComponent(sp.error)}
            </div>
          )}

          <LoginForm next={sp.next} />

          <p className="mt-8 text-xs text-center text-[var(--color-ink-muted)]">
            Pas encore de compte ? Le magic link te crée un compte automatiquement.
          </p>
        </div>
      </main>
    </div>
  );
}
