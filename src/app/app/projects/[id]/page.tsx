import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateRelative } from "@/lib/utils";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, problematique, created_at, updated_at")
    .eq("id", id)
    .single();

  const { data: searches = [] } = await supabase
    .from("searches")
    .select("id, query, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: problematiques = [] } = await supabase
    .from("problematiques")
    .select("id, chosen, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { count } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);
  const memberCount = count ?? 0;

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Card>
        <CardHeader>
          <CardTitle>État de l'art</CardTitle>
          <CardDescription>
            Recherche bibliographique automatique via OpenAlex (sources peer-reviewed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-ink-soft)] mb-4">
            {searches?.length ? (
              <>
                <strong>{searches.length}</strong> recherche{searches.length > 1 ? "s" : ""} effectuée{searches.length > 1 ? "s" : ""}.
                Dernière : {formatDateRelative(searches[0].created_at)}.
              </>
            ) : (
              <>Pas encore de recherche. Lance ton premier état de l'art.</>
            )}
          </p>
          <Link href={`/app/projects/${id}/etat-de-lart`}>
            <Button>{searches?.length ? "Voir / nouvelle recherche" : "Lancer Module 1"}</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Problématique</CardTitle>
          <CardDescription>
            Coach socratique : 8 questions, 3 propositions reformulées avec plan détaillé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-ink-soft)] mb-4">
            {project?.problematique ? (
              <em>"{truncate(project.problematique, 140)}"</em>
            ) : problematiques?.length ? (
              <>{problematiques.length} sessions passées.</>
            ) : (
              <>Pas encore de problématique. Démarre le Module 2.</>
            )}
          </p>
          <Link href={`/app/projects/${id}/problematique`}>
            <Button>{problematiques?.length ? "Voir / nouvelle session" : "Lancer Module 2"}</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Équipe</CardTitle>
          <CardDescription>
            {memberCount === 0
              ? "Tu travailles seul. Invite ton directeur, un mentor ou un pair."
              : `${memberCount} collaborateur${memberCount > 1 ? "s" : ""} sur ce projet.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/app/projects/${id}/equipe`}>
            <Button variant="outline">Gérer l'équipe</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
