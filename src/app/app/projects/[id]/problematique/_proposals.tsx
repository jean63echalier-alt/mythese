"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Watermark } from "@/components/ui/watermark";
import { Button } from "@/components/ui/button";

export interface ProposalPart {
  title: string;
  bullets: string[];
}

export interface Proposal {
  letter: string; // A / B / C
  problematique: string;
  planType: "binaire" | "ternaire";
  parts: ProposalPart[];
}

export function ProposalsViewer({
  proposals,
  sessionId,
}: {
  proposals: Proposal[];
  sessionId: string;
}) {
  if (!proposals || proposals.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Aucune proposition.</p>;
  }
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {proposals.map((p) => (
        <ProposalCard key={p.letter} proposal={p} sessionId={sessionId} />
      ))}
    </div>
  );
}

function ProposalCard({
  proposal,
  sessionId,
}: {
  proposal: Proposal;
  sessionId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "err">("idle");

  async function choose() {
    setState("saving");
    const res = await fetch(`/api/problematiques/${sessionId}/choose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chosen: proposal.problematique }),
    });
    if (!res.ok) {
      setState("err");
      return;
    }
    setState("saved");
    router.refresh();
  }

  return (
    <article className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-full bg-[var(--color-burgundy)] text-white font-serif font-semibold flex items-center justify-center text-sm">
          {proposal.letter}
        </span>
        <span className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider">
          Plan {proposal.planType}
        </span>
      </div>

      <p className="font-serif text-base leading-snug italic text-[var(--color-ink)] mb-4">
        "{proposal.problematique}"
      </p>

      <div className="space-y-3 flex-1">
        {proposal.parts.map((part, i) => (
          <div key={i}>
            <div className="text-sm font-semibold text-[var(--color-ink)]">
              {romanNumeral(i + 1)}. {part.title}
            </div>
            <ul className="mt-1 text-xs text-[var(--color-ink-soft)] list-disc pl-4 space-y-0.5">
              {(part.bullets ?? []).map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-line-soft)]">
        <Button
          size="sm"
          variant={state === "saved" ? "outline" : "primary"}
          onClick={choose}
          disabled={state === "saving" || state === "saved"}
          className="w-full"
        >
          {state === "saving"
            ? "..."
            : state === "saved"
            ? "✓ Choisie"
            : "Choisir cette proposition"}
        </Button>
      </div>

      <Watermark />
    </article>
  );
}

function romanNumeral(n: number): string {
  const map = ["", "I", "II", "III", "IV", "V"];
  return map[n] ?? String(n);
}
