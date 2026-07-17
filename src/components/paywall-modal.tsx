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

  const oneShotFeatures = [
    "Recherches Module 1 illimitées (20 sources, au lieu de 10 en gratuit)",
    "Générations Module 2 illimitées",
    "Plan de recherche débloqué (6 étapes + conseils IA croisés)",
    projectId ? "Valable 90 jours sur ce mémoire" : "Valable 90 jours sur le mémoire de ton choix",
  ];

  const subscriptionFeatures = [
    "Tous tes projets débloqués, sans limite",
    "Plan de recherche illimité",
    "Chaque nouveau projet est débloqué automatiquement",
    "Résiliable à tout moment",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => goToCheckout("one_shot")}
            disabled={loading !== null}
            className="w-full text-left rounded-md border border-[var(--color-line)] p-4 hover:bg-[var(--color-cream)] disabled:opacity-50"
          >
            <div className="font-medium mb-2">{projectId ? "Débloquer ce projet" : "Débloquer un mémoire"} — 39 €</div>
            <ul className="space-y-1">
              {oneShotFeatures.map((f) => (
                <li key={f} className="text-sm text-[var(--color-ink-muted)] flex gap-2">
                  <span className="text-[var(--color-burgundy)]">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
          <button
            onClick={() => goToCheckout("subscription")}
            disabled={loading !== null}
            className="w-full text-left rounded-md border border-[var(--color-line)] p-4 hover:bg-[var(--color-cream)] disabled:opacity-50"
          >
            <div className="font-medium mb-2">Illimité — 19 €/mois</div>
            <ul className="space-y-1">
              {subscriptionFeatures.map((f) => (
                <li key={f} className="text-sm text-[var(--color-ink-muted)] flex gap-2">
                  <span className="text-[var(--color-burgundy)]">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
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
