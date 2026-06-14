import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateRelative } from "@/lib/utils";
import { ETAPES, STATUT_LABELS, STATUT_STYLES, type PlanStatut } from "@/lib/plan";
import { SubmissionForm } from "../_submission-form";
import { ConseilIA } from "./_conseil-ia";

export default async function EtapeDetailPage({
  params,
}: {
  params: Promise<{ etapeId: string }>;
}) {
  const { etapeId: raw } = await params;
  const etapeId = Number(raw);
  const etape = ETAPES.find((e) => e.id === etapeId);
  if (!etape) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: progression } = await supabase
    .from("etudiant_progression")
    .select("statut, resume_ia, derniere_maj")
    .eq("user_id", user!.id)
    .eq("etape_id", etapeId)
    .maybeSingle();

  const { data: soumissions = [] } = await supabase
    .from("soumissions")
    .select("id, type_contenu, contenu_extrait, date")
    .eq("user_id", user!.id)
    .eq("etape_id", etapeId)
    .order("date", { ascending: false })
    .limit(10);

  const statut = (progression?.statut ?? "a_demarrer") as PlanStatut;
  const lastTexte = soumissions?.[0]?.contenu_extrait ?? "";

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 space-y-6">
      <Link href="/app/plan" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
        ← Plan de recherche
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            {etape.id}. {etape.titre}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">{etape.description}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded shrink-0 ${STATUT_STYLES[statut]}`}>
          {statut === "valide" ? "✓ " : ""}
          {STATUT_LABELS[statut]}
        </span>
      </div>

      {progression?.resume_ia && (
        <p className="text-sm rounded-md bg-[var(--color-cream)] p-3 text-[var(--color-ink-soft)]">
          {progression.resume_ia}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Soumettre du contenu</CardTitle>
          <CardDescription>L'IA analyse ce contenu et met à jour le statut de cette étape.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionForm etapeId={etapeId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conseil IA croisé</CardTitle>
          <CardDescription>Claude + GPT analysent ton travail et te proposent une synthèse actionnable.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConseilIA etapeId={etapeId} defaultTexte={lastTexte} />
        </CardContent>
      </Card>

      {soumissions && soumissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des soumissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {soumissions.map((s) => (
              <div key={s.id} className="border-b border-[var(--color-line-soft)] pb-3 last:border-0 last:pb-0">
                <div className="text-xs text-[var(--color-ink-muted)] mb-1">
                  {s.type_contenu} · {formatDateRelative(s.date)}
                </div>
                <p className="text-sm text-[var(--color-ink-soft)] line-clamp-3">{s.contenu_extrait}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
