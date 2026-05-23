"use client";

import { Watermark } from "@/components/ui/watermark";

export interface ReviewFeedback {
  sections: Array<{
    title: string;
    bullets: string[];
  }>;
}

export function ReviewViewer({ feedback }: { feedback: ReviewFeedback }) {
  if (!feedback || !feedback.sections || feedback.sections.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Aucune relecture.</p>;
  }

  return (
    <article className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-4">
      {feedback.sections.map((section, i) => (
        <div key={i}>
          <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">
            {section.title}
          </h3>
          <ul className="text-sm text-[var(--color-ink-soft)] list-disc pl-5 space-y-1">
            {(section.bullets ?? []).map((bullet, j) => (
              <li key={j}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="pt-3 border-t border-[var(--color-line-soft)]">
        <Watermark />
      </div>
    </article>
  );
}
