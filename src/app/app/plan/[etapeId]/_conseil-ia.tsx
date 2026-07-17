"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Watermark } from "@/components/ui/watermark";
import { PaywallModal } from "@/components/paywall-modal";

type Avis = { avis_claude: string; avis_gpt: string; synthese: string };

export function ConseilIA({ etapeId, defaultTexte }: { etapeId: number; defaultTexte: string }) {
  const [texte, setTexte] = useState(defaultTexte);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [avis, setAvis] = useState<Avis | null>(null);
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [paywall, setPaywall] = useState(false);

  async function run() {
    if (!texte.trim() || !question.trim()) {
      setError("Renseigne le contenu et ta question.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/plan/conseil-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etape_id: etapeId, texte_soumis: texte, question }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setStatus("idle");
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setAvis(data);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
      setStatus("error");
    }
  }

  if (!open) {
    return <Button variant="outline" onClick={() => setOpen(true)}>Conseil IA croisé</Button>;
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-cream)] p-4 space-y-3">
      <div>
        <Label htmlFor="conseil-texte">Contenu à analyser</Label>
        <Textarea id="conseil-texte" value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} disabled={status === "loading"} />
      </div>
      <div>
        <Label htmlFor="conseil-question">Ta question</Label>
        <Textarea
          id="conseil-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="Ex : Ma méthodologie tient-elle la route pour répondre à ma problématique ?"
          disabled={status === "loading"}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={run} disabled={status === "loading"}>
          {status === "loading" ? "Analyse en cours…" : "Lancer le conseil croisé"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Fermer</Button>
      </div>

      {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}

      {avis && (
        <div className="space-y-3 pt-2">
          <div className="rounded-md border-2 border-[var(--color-burgundy)] bg-[var(--color-paper)] p-4">
            <p className="font-serif text-lg font-semibold mb-2">Synthèse recommandée</p>
            <p className="text-sm whitespace-pre-wrap">{avis.synthese}</p>
            <Watermark className="mt-2" />
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-sm text-[var(--color-ink-soft)] underline"
          >
            {showDetails ? "Masquer" : "Voir"} les avis détaillés (Claude / GPT)
          </button>

          {showDetails && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
                <p className="text-xs font-medium text-[var(--color-ink-muted)] mb-1">Avis Claude</p>
                <p className="text-sm whitespace-pre-wrap">{avis.avis_claude}</p>
              </div>
              <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
                <p className="text-xs font-medium text-[var(--color-ink-muted)] mb-1">Avis GPT</p>
                <p className="text-sm whitespace-pre-wrap">{avis.avis_gpt}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {paywall && (
        <PaywallModal
          title="Plan de recherche verrouillé"
          message="Le Plan de recherche nécessite un déblocage (39€ un mémoire, ou 19€/mois illimité)."
          onClose={() => setPaywall(false)}
        />
      )}
    </div>
  );
}
