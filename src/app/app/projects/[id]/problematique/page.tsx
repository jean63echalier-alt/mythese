import { createClient } from "@/lib/supabase/server";
import { Module2Wizard } from "./_wizard";
import { ProposalsViewer } from "./_proposals";
import { formatDateRelative } from "@/lib/utils";

export const metadata = { title: "Problématique — Mythese" };

export default async function ProblematiquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, discipline, problematique")
    .eq("id", id)
    .single();

  const { data: history = [] } = await supabase
    .from("problematiques")
    .select("id, answers, proposals, chosen, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-2xl font-semibold mb-1">Module 2 — Coach problématique</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-5">
          8 questions socratiques. 3 propositions reformulées avec plan binaire ou ternaire.
          Bullets uniquement, jamais de prose à coller.
        </p>
        <Module2Wizard
          projectId={id}
          context={{
            title: project?.title ?? "",
            discipline: project?.discipline ?? "",
            problematique: project?.problematique ?? "",
          }}
        />
      </section>

      {(history?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-3">Sessions précédentes</h2>
          <div className="space-y-4">
            {history!.map((h) => (
              <details
                key={h.id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
              >
                <summary className="cursor-pointer">
                  <span className="font-medium">
                    {h.chosen ? `Choisie : ${truncate(h.chosen, 80)}` : "(aucune choisie)"}
                  </span>
                  <span className="text-xs text-[var(--color-ink-muted)] ml-2">
                    {formatDateRelative(h.created_at)}
                  </span>
                </summary>
                <div className="mt-4">
                  <ProposalsViewer proposals={(h.proposals ?? []) as any} sessionId={h.id} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
