"use client";

import { cn } from "@/lib/utils";
import type { Section, StatutSection } from "./types";

const STATUT_STYLE: Record<StatutSection, { icon: string; color: string; label: string }> = {
  non_commence: { icon: "⊘", color: "text-[var(--color-ink-muted)]", label: "Non commencé" },
  en_cours: { icon: "①", color: "text-blue-600", label: "En cours de rédaction" },
  valide: { icon: "✓", color: "text-[var(--color-forest)]", label: "Validé / relu par le prof" },
  a_revoir: { icon: "✗", color: "text-[var(--color-burgundy)]", label: "À revoir / rejeté par le prof" },
};

export function PlanPanel({
  sections,
  activeId,
  onSelect,
}: {
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)] px-2 mb-2">
        Plan du mémoire
      </h2>
      <ul className="space-y-0.5">
        {sections
          .slice()
          .sort((a, b) => a.ordre - b.ordre)
          .map((s) => {
            const st = STATUT_STYLE[s.statut];
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  title={st.label}
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-[var(--color-cream)] text-[var(--color-ink)] font-medium"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]",
                  )}
                >
                  <span className={cn("shrink-0 text-base leading-none", st.color)}>{st.icon}</span>
                  <span className="truncate">{s.nom}</span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
