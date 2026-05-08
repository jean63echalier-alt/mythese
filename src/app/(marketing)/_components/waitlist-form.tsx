"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("m1");
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, level, topic }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'inscription");
      }
      setState("ok");
    } catch (err) {
      setState("err");
      setErrMsg(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  if (state === "ok") {
    return (
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-center animate-fade-in">
        <div className="text-3xl mb-2">✓</div>
        <div className="font-serif text-xl font-semibold mb-1">Tu y es.</div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          On t'envoie un email de confirmation et on te prévient dès le lancement du MVP.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid md:grid-cols-[1fr_auto] gap-2">
        <Input
          type="email"
          placeholder="ton@email.fr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "loading"}
        />
        <Button type="submit" size="md" disabled={state === "loading"}>
          {state === "loading" ? "..." : "Rejoins la waitlist"}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <Select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={state === "loading"}
        >
          <option value="m1">Master 1</option>
          <option value="m2">Master 2</option>
          <option value="doctorat">Doctorat</option>
          <option value="autre">Autre (Licence pro, TFE…)</option>
        </Select>
        <Input
          placeholder="Sujet pressenti (optionnel)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={state === "loading"}
          maxLength={120}
        />
      </div>
      {state === "err" && (
        <p className="text-xs text-red-700">{errMsg}</p>
      )}
      <p className="text-xs text-[var(--color-ink-muted)] text-left">
        En t'inscrivant, tu acceptes de recevoir des nouvelles sur le lancement. Désinscription en 1 clic.
      </p>
    </form>
  );
}
