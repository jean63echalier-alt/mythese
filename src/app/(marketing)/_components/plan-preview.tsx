import { ETAPES, STATUT_LABELS, STATUT_STYLES, type PlanStatut } from "@/lib/plan";

// Aperçu statique — exemple pré-rempli, aucun appel API
const EXEMPLE: { statut: PlanStatut; resume: string }[] = [
  { statut: "valide", resume: "Sujet cadré, problématique formulée et validée." },
  { statut: "valide", resume: "12 sources clés synthétisées, cartographie des courants établie." },
  { statut: "en_cours", resume: "Approche qualitative choisie, guide d'entretien en cours de finalisation." },
  { statut: "a_demarrer", resume: "Entretiens à programmer auprès de l'échantillon ciblé." },
  { statut: "a_demarrer", resume: "En attente de la collecte pour lancer l'analyse." },
  { statut: "a_approfondir", resume: "Plan de soutenance esquissé, argumentaire à renforcer." },
];

export function PlanPreview() {
  const validCount = EXEMPLE.filter((e) => e.statut === "valide").length;
  const progressPct = Math.round((validCount / ETAPES.length) * 100);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6 max-w-2xl mx-auto">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[var(--color-ink-soft)]">Progression du mémoire</span>
        <span className="font-medium">{progressPct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-line-soft)] overflow-hidden mb-5">
        <div className="h-full bg-[var(--color-burgundy)]" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="space-y-2">
        {ETAPES.map((e, i) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-line-soft)] px-3 py-2">
            <span className="text-sm font-medium">{e.id}. {e.titre}</span>
            <span className={`text-xs px-2 py-1 rounded shrink-0 ${STATUT_STYLES[EXEMPLE[i].statut]}`}>
              {EXEMPLE[i].statut === "valide" ? "✓ " : ""}
              {STATUT_LABELS[EXEMPLE[i].statut]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
