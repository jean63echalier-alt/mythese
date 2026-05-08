"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrMsg("");
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setState("err");
      setErrMsg(error.message);
      return;
    }
    setState("sent");
  }

  async function googleSignIn() {
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setState("err");
      setErrMsg(`Google : ${error.message}`);
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-center">
        <div className="text-3xl mb-2">📬</div>
        <div className="font-serif text-xl font-semibold mb-1">Lien envoyé</div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Clique sur le lien dans l'email envoyé à <strong>{email}</strong>.<br />
          Tu peux fermer cet onglet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={googleSignIn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continuer avec Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
        <div className="flex-1 h-px bg-[var(--color-line)]" />
        ou
        <div className="flex-1 h-px bg-[var(--color-line)]" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="ton@email.fr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "loading"}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={state === "loading"}>
          {state === "loading" ? "Envoi..." : "Recevoir un lien magique"}
        </Button>
        {state === "err" && (
          <p className="text-xs text-red-700">{errMsg}</p>
        )}
      </form>
    </div>
  );
}
