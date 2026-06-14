"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { ETAPES } from "@/lib/plan";

export function SubmissionForm({ etapeId }: { etapeId?: number }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<{ id: number; statut: string; justification: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!texte.trim() && !file) {
      setError("Colle du texte ou choisis un fichier.");
      return;
    }
    setStatus("loading");
    setError(null);
    setResult(null);

    const form = new FormData();
    if (file) form.set("fichier", file);
    else form.set("texte", texte);

    try {
      const res = await fetch("/api/plan/classifier", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setResult(data.etapes ?? []);
      setTexte("");
      if (fileRef.current) fileRef.current.value = "";
      setStatus("idle");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="texte">
          {etapeId ? "Soumettre du contenu pour cette étape" : "Soumission libre"}
        </Label>
        <Textarea
          id="texte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Colle un extrait de ton travail (texte, notes, brouillon...)"
          rows={4}
          disabled={status === "loading"}
        />
      </div>
      <div>
        <Label htmlFor="fichier">Ou un document (PDF / Word)</Label>
        <input
          id="fichier"
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,text/plain"
          disabled={status === "loading"}
          className="block w-full text-sm text-[var(--color-ink-soft)]"
        />
      </div>
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Analyse en cours…" : "Analyser avec l'IA"}
      </Button>

      {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}

      {result && result.length > 0 && (
        <div className="rounded-md bg-[var(--color-cream)] p-3 text-sm space-y-1">
          <p className="font-medium">Mise à jour du plan :</p>
          {result.map((r) => (
            <p key={r.id} className="text-[var(--color-ink-soft)]">
              <strong>{ETAPES.find((e) => e.id === r.id)?.titre ?? `Étape ${r.id}`}</strong> — {r.statut} : {r.justification}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
