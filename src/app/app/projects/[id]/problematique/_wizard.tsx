"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { ProposalsViewer, Proposal } from "./_proposals";

const QUESTIONS = [
  { id: "phenomene", q: "Quel phénomène t'interroge ?", help: "Décris-le en 2-3 lignes, le plus concret possible." },
  { id: "pourquoi_maintenant", q: "Pourquoi maintenant ?", help: "Qu'est-ce qui rend ce phénomène urgent ou actuel ?" },
  { id: "pour_qui", q: "Pour qui c'est important ?", help: "Quel public, quelle communauté, quel acteur a un intérêt ?" },
  { id: "angle_unique", q: "Qu'est-ce que tu observes que les autres ne voient pas ?", help: "Ton angle, ce qui te distingue d'une étude classique." },
  { id: "hypotheses", q: "Quelles sont les 2-3 hypothèses concurrentes ?", help: "Plusieurs explications possibles du phénomène." },
  { id: "discipline", q: "Quelle discipline éclaire le mieux ce phénomène ?", help: "Sociologie ? Comm ? Marketing ? Pourquoi ?" },
  { id: "concepts", q: "Quels sont les 3 concepts clés à mobiliser ?", help: "Les notions théoriques que tu vas convoquer." },
  { id: "angle_defendre", q: "Quel angle veux-tu défendre ?", help: "La thèse principale, la position que tu vas argumenter." },
] as const;

type AnswerKey = (typeof QUESTIONS)[number]["id"];

export function Module2Wizard({
  projectId,
  context,
}: {
  projectId: string;
  context: { title: string; discipline: string; problematique: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<"asking" | "loading" | "ok" | "err">("asking");
  const [errMsg, setErrMsg] = useState("");

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const currentValue = answers[current.id] ?? "";

  function setAnswer(v: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: v }));
  }

  async function next() {
    if (!currentValue.trim()) return;
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    // Submit
    setState("loading");
    setErrMsg("");
    try {
      const res = await fetch(`/api/projects/${projectId}/problematiques`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, context }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const { proposals, id } = await res.json();
      setProposals(proposals);
      setSessionId(id);
      setState("ok");
      router.refresh();
    } catch (err) {
      setState("err");
      setErrMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (state === "ok" && proposals && sessionId) {
    return (
      <div>
        <h3 className="font-serif text-xl font-semibold mb-3">
          3 propositions de problématique
        </h3>
        <ProposalsViewer proposals={proposals} sessionId={sessionId} />
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setProposals(null);
              setSessionId(null);
              setStep(0);
              setAnswers({});
              setState("asking");
            }}
          >
            Refaire une session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider">
          Question {step + 1} / {QUESTIONS.length}
        </span>
        <div className="flex gap-1">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={`h-1 w-6 rounded-full ${
                i <= step
                  ? "bg-[var(--color-burgundy)]"
                  : "bg-[var(--color-line)]"
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="font-serif text-2xl font-semibold mb-1">
        {current.q}
      </h3>
      <p className="text-sm text-[var(--color-ink-muted)] mb-4">
        {current.help}
      </p>

      <Textarea
        rows={4}
        value={currentValue}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Ta réponse en 2-5 lignes…"
        autoFocus
        disabled={state === "loading"}
      />

      {state === "err" && (
        <p className="text-sm text-red-700 mt-2">{errMsg}</p>
      )}

      <div className="mt-5 flex justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          disabled={step === 0 || state === "loading"}
        >
          ← Précédent
        </Button>
        <Button
          type="button"
          onClick={next}
          disabled={!currentValue.trim() || state === "loading"}
          size="lg"
        >
          {state === "loading"
            ? "Mythese réfléchit…"
            : isLast
            ? "Générer 3 propositions"
            : "Suivant →"}
        </Button>
      </div>
    </div>
  );
}
