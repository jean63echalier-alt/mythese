import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ETAPES, STATUT_LABELS, STATUT_STYLES, type PlanStatut } from "@/lib/plan";
import { SubmissionForm } from "./_submission-form";

export const metadata = { title: "Plan de recherche — Mythese" };

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: progression = [] } = await supabase
    .from("etudiant_progression")
    .select("etape_id, statut, resume_ia")
    .eq("user_id", user!.id);

  const byEtape = new Map(
    (progression ?? []).map((p) => [p.etape_id, p as { etape_id: number; statut: PlanStatut; resume_ia: string | null }]),
  );

  const etapes = ETAPES.map((e) => {
    const p = byEtape.get(e.id);
    return { ...e, statut: (p?.statut ?? "a_demarrer") as PlanStatut, resume: p?.resume_ia ?? null };
  });

  const validCount = etapes.filter((e) => e.statut === "valide").length;
  const progressPct = Math.round((validCount / ETAPES.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Plan de recherche</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Soumets ton travail à tout moment : l'IA met à jour ta progression sur les 6 étapes.
        </p>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-[var(--color-ink-soft)]">Progression globale</span>
          <span className="font-medium">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-line-soft)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-burgundy)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {etapes.map((e) => (
          <Link
            key={e.id}
            href={`/app/plan/${e.id}`}
            className="block rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4 hover:border-[var(--color-burgundy)] hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-serif text-lg font-semibold">
                  {e.id}. {e.titre}
                </div>
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                  {e.resume ?? e.description}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded shrink-0 ${STATUT_STYLES[e.statut]}`}>
                {e.statut === "valide" ? "✓ " : ""}
                {STATUT_LABELS[e.statut]}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soumission libre</CardTitle>
          <CardDescription>
            Pas sûr de l'étape concernée ? Soumets ton contenu ici, l'IA le classera elle-même.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionForm />
        </CardContent>
      </Card>
    </div>
  );
}
