import { createClient } from "@/lib/supabase/server";
import { Module1Form } from "./_form";
import { ResultsViewer } from "./_results";
import { formatDateRelative } from "@/lib/utils";

export const metadata = { title: "État de l'art — Mythese" };

export default async function EtatDeLArtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, problematique")
    .eq("id", id)
    .single();

  const { data: searches = [] } = await supabase
    .from("searches")
    .select("id, query, keywords, problematique, results, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-2xl font-semibold mb-1">Module 1 — État de l'art</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-5">
          Sources peer-reviewed via OpenAlex (250M papers). Reformulation auto + résumé + pertinence + APA.
          Aucune prose, jamais.
        </p>
        <Module1Form
          projectId={id}
          defaultProblematique={project?.problematique ?? ""}
        />
      </section>

      {(searches?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-3">
            Recherches précédentes
          </h2>
          <div className="space-y-6">
            {searches!.map((s) => (
              <details
                key={s.id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
              >
                <summary className="cursor-pointer">
                  <div className="font-medium inline">"{s.query}"</div>
                  <div className="text-xs text-[var(--color-ink-muted)] inline ml-2">
                    {Array.isArray(s.results) ? s.results.length : 0} sources · {formatDateRelative(s.created_at)}
                  </div>
                </summary>
                <div className="mt-4">
                  <ResultsViewer results={s.results as any[]} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
