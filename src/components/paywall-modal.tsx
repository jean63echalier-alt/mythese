"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PaywallModal({
  projectId,
  title = "Recherche gratuite utilisée",
  message,
  onClose,
}: {
  projectId?: string;
  title?: string;
  message: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<"one_shot" | "subscription" | null>(null);
  const [error, setError] = useState("");

  async function goToCheckout(type: "one_shot" | "subscription") {
    setLoading(type);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, projectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => goToCheckout("one_shot")}
            disabled={loading !== null}
            className="w-full text-left rounded-md border border-[var(--color-line)] p-3 hover:bg-[var(--color-cream)] disabled:opacity-50"
          >
            <div className="font-medium">{projectId ? "Débloquer ce projet" : "Débloquer un mémoire"} — 39 €</div>
            <div className="text-sm text-[var(--color-ink-muted)]">
              {projectId ? "4 modules illimités sur ce mémoire, 90 jours" : "Débloque aussi le Plan de recherche, 90 jours"}
            </div>
          </button>
          <button
            onClick={() => goToCheckout("subscription")}
            disabled={loading !== null}
            className="w-full text-left rounded-md border border-[var(--color-line)] p-3 hover:bg-[var(--color-cream)] disabled:opacity-50"
          >
            <div className="font-medium">Illimité — 19 €/mois</div>
            <div className="text-sm text-[var(--color-ink-muted)]">Tous tes projets, tant que l'abonnement est actif</div>
          </button>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onClose} disabled={loading !== null}>
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
