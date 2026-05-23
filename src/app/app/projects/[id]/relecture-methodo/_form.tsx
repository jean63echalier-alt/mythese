"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReviewViewer } from "./_viewer";

export interface ReviewFeedback {
  sections: Array<{
    title: string;
    bullets: string[];
  }>;
}

export function ReviewForm({
  projectId,
  context,
  searchCount,
}: {
  projectId: string;
  context: {
    title: string;
    discipline: string;
    problematique: string;
  };
  searchCount: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!context.problematique) {
      setErrMsg("Définissez d'abord votre problématique (Module 2).");
      setState("err");
      return;
    }

    setState("loading");
    setErrMsg("");

    try {
      const res = await fetch(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, searchCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const { feedback } = await res.json();
      setFeedback(feedback);
      setState("ok");
      router.refresh();
    } catch (err) {
      setState("err");
      setErrMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-4"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium">Contexte du projet</p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[var(--color-ink-soft)]">Titre :</span> {context.title || "(non défini)"}
            </div>
            <div>
              <span className="text-[var(--color-ink-soft)]">Discipline :</span> {context.discipline || "(non défini)"}
            </div>
            <div>
              <span className="text-[var(--color-ink-soft)]">Problématique :</span>{" "}
              {context.problematique || "(non défini)"}
            </div>
            <div>
              <span className="text-[var(--color-ink-soft)]">Sources état de l'art :</span> {searchCount}
            </div>
          </div>
        </div>

        {state === "err" && (
          <p className="text-sm text-red-700">{errMsg}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={state === "loading"}>
            {state === "loading" ? "Analyse en cours…" : "Générer la relecture"}
          </Button>
        </div>

        {state === "loading" && (
          <p className="text-xs text-[var(--color-ink-muted)] text-center">
            Cela prend généralement 10 à 15 secondes.
          </p>
        )}
      </form>

      {state === "ok" && feedback && (
        <div>
          <h3 className="font-serif text-xl font-semibold mb-3">
            Analyse méthodologique
          </h3>
          <ReviewViewer feedback={feedback} />
        </div>
      )}
    </div>
  );
}
