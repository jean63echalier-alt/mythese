"use client";

import { useState } from "react";
import { Watermark } from "@/components/ui/watermark";
import { Button } from "@/components/ui/button";

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

export function ResultsViewer({ results }: { results: Module1Result[] }) {
  if (!results || results.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">Aucun résultat.</p>
    );
  }
  return (
    <div className="space-y-4">
      {results.map((r, i) => (
        <ResultCard key={(r.doi ?? "") + i} result={r} index={i + 1} />
      ))}
    </div>
  );
}

function ResultCard({ result, index }: { result: Module1Result; index: number }) {
  const [copied, setCopied] = useState(false);
  const authors = result.authors.slice(0, 4).join(", ") +
    (result.authors.length > 4 ? ", et al." : "");

  async function copyApa() {
    await navigator.clipboard.writeText(result.citationApa);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 hover:border-[var(--color-burgundy-soft)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--color-ink-muted)] mb-1">
            #{index} · {result.year ?? "s.d."}
            {result.citations > 0 && ` · ${result.citations} citations`}
          </div>
          <h4 className="font-serif text-lg font-semibold leading-snug">
            {result.title}
          </h4>
          <div className="text-sm text-[var(--color-ink-soft)] mt-1">
            {authors}
            {result.journal && (
              <span className="text-[var(--color-ink-muted)]"> · <em>{result.journal}</em></span>
            )}
          </div>
        </div>
      </div>

      {result.summary && result.summary.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
            Résumé
          </div>
          <ul className="text-sm text-[var(--color-ink) ] space-y-1 list-disc pl-5">
            {result.summary.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {result.pertinence && result.pertinence.length > 0 && (
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
            Pertinence vs problématique
          </div>
          <ul className="text-sm text-[var(--color-ink-soft)] space-y-1 list-disc pl-5">
            {result.pertinence.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[var(--color-line-soft)] flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {result.doiUrl && (
            <a
              href={result.doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream)]"
            >
              ↗ DOI / source
            </a>
          )}
          <Button size="sm" variant="outline" onClick={copyApa}>
            {copied ? "✓ copié" : "Copier citation APA"}
          </Button>
        </div>
      </div>

      <Watermark />
    </article>
  );
}
