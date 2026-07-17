"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { PaywallModal } from "@/components/paywall-modal";
import { ResultsViewer } from "./_results";

export interface Module1Result {
  doi: string | null;
  doiUrl: string | null;
  title: string;
  year: number | null;
  authors: string[];
  journal: string | null;
  citations: number;
  citationApa: string;
  summary: string[];
  pertinence: string[];
}

export function Module1Form({
  projectId,
  defaultProblematique,
}: {
  projectId: string;
  defaultProblematique: string;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [problematique, setProblematique] = useState(defaultProblematique);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [stage, setStage] = useState("");
  const [results, setResults] = useState<Module1Result[] | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [paywall, setPaywall] = useState(false);

  function addKeyword() {
    const k = keywordInput.trim();
    if (!k) return;
    if (keywords.includes(k)) return;
    if (keywords.length >= 8) return;
    setKeywords([...keywords, k]);
    setKeywordInput("");
  }

  function removeKeyword(k: string) {
    setKeywords(keywords.filter((x) => x !== k));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (keywords.length < 2) {
      setErrMsg("Ajoute au moins 2 mots-clés.");
      setState("err");
      return;
    }
    setState("loading");
    setErrMsg("");
    setStage("Reformulation des mots-clés…");

    try {
      const stages = [
        "Reformulation des mots-clés…",
        "Recherche dans OpenAlex (250M papers)…",
        "Sélection des sources peer-reviewed…",
        "Génération des résumés et pertinence…",
      ];
      let i = 0;
      const stageTimer = setInterval(() => {
        if (i < stages.length - 1) setStage(stages[++i]);
      }, 7000);

      const res = await fetch(`/api/projects/${projectId}/searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, keywords, problematique }),
      });

      clearInterval(stageTimer);

      if (res.status === 402) {
        setState("idle");
        setPaywall(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const { results } = await res.json();
      setResults(results);
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
        <div>
          <Label htmlFor="topic">Sujet de recherche</Label>
          <Input
            id="topic"
            required
            maxLength={300}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: solutions publicitaires en milieu urbain"
            disabled={state === "loading"}
          />
        </div>

        <div>
          <Label>Mots-clés (3 à 5 minimum)</Label>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Tape un mot-clé puis Entrée"
              disabled={state === "loading" || keywords.length >= 8}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addKeyword}
              disabled={state === "loading" || keywords.length >= 8}
            >
              Ajouter
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-cream)] border border-[var(--color-line)] text-sm"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => removeKeyword(k)}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    aria-label="Retirer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="problematique-m1">Problématique pressentie (optionnel)</Label>
          <Textarea
            id="problematique-m1"
            rows={3}
            maxLength={1000}
            value={problematique}
            onChange={(e) => setProblematique(e.target.value)}
            placeholder="Aide Mythese à juger la pertinence des sources."
            disabled={state === "loading"}
          />
        </div>

        {state === "err" && (
          <p className="text-sm text-red-700">{errMsg}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={state === "loading"}>
            {state === "loading" ? stage || "Recherche..." : "Lancer la recherche"}
          </Button>
        </div>

        {state === "loading" && (
          <p className="text-xs text-[var(--color-ink-muted)] text-center">
            Cela prend généralement 20 à 30 secondes.
          </p>
        )}
      </form>

      {state === "ok" && results && (
        <div>
          <h3 className="font-serif text-xl font-semibold mb-3">
            Résultats — {results.length} sources
          </h3>
          <ResultsViewer results={results} />
        </div>
      )}

      {paywall && (
        <PaywallModal
          projectId={projectId}
          message="Ta recherche gratuite (Module 1) sur ce projet a déjà été utilisée."
          onClose={() => setPaywall(false)}
        />
      )}
    </div>
  );
}
