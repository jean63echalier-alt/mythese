import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./_form";
import { ReviewViewer } from "./_viewer";
import { formatDateRelative } from "@/lib/utils";

export const metadata = { title: "Relecture méthodologique — Mythese" };

export default async function ReviewPage({
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

  const { data: searchCount = [] } = await supabase
    .from("searches")
    .select("id", { count: "exact" })
    .eq("project_id", id);

  const { data: reviews = [] } = await supabase
    .from("reviews")
    .select("id, feedback, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-2xl font-semibold mb-1">Module 3 — Relecture méthodologique</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-5">
          Analyse structurée de ta problématique et de ta méthodologie. Clarté · pertinence · faisabilité.
          Jamais de prose, toujours des suggestions.
        </p>
        <ReviewForm
          projectId={id}
          context={{
            title: project?.title ?? "",
            discipline: project?.discipline ?? "",
            problematique: project?.problematique ?? "",
          }}
          searchCount={searchCount?.length ?? 0}
        />
      </section>

      {(reviews?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-3">
            Relectures précédentes
          </h2>
          <div className="space-y-4">
            {reviews!.map((r) => (
              <details
                key={r.id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
              >
                <summary className="cursor-pointer">
                  <span className="font-medium">
                    Relecture
                  </span>
                  <span className="text-xs text-[var(--color-ink-muted)] ml-2">
                    {formatDateRelative(r.created_at)}
                  </span>
                </summary>
                <div className="mt-4">
                  <ReviewViewer feedback={r.feedback as any} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
