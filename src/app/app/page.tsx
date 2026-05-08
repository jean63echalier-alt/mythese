import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDateRelative } from "@/lib/utils";

export const metadata = { title: "Mes projets — Mythese" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Owned projects
  const { data: owned = [] } = await supabase
    .from("projects")
    .select("id, title, discipline, level, updated_at")
    .order("updated_at", { ascending: false });

  // Memberships (other than owner)
  const { data: members = [] } = await supabase
    .from("project_members")
    .select("role, project:projects(id, title, discipline, level, updated_at, owner_id)")
    .order("created_at", { ascending: false });

  type ProjectRow = {
    id: string;
    title: string;
    discipline: string | null;
    level: string | null;
    updated_at: string;
    role: "owner" | "author" | "director" | "reader";
  };

  const projects: ProjectRow[] = [
    ...(owned ?? []).map((p) => ({ ...p, role: "owner" as const })),
    ...((members ?? [])
      .filter((m) => m.project && (m.project as any).owner_id !== user!.id)
      .map((m) => {
        const proj = m.project as any;
        return {
          id: proj.id,
          title: proj.title,
          discipline: proj.discipline,
          level: proj.level,
          updated_at: proj.updated_at,
          role: m.role as "author" | "director" | "reader",
        };
      })),
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Mes projets</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Tes mémoires, thèses et dossiers de recherche.
          </p>
        </div>
        <Link href="/app/projects/new">
          <Button size="lg">+ Nouveau projet</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-cream)] p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h2 className="font-serif text-xl font-semibold mb-2">Pas encore de projet</h2>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6 max-w-md mx-auto">
            Crée ton premier projet pour démarrer. Chaque projet contient ton
            état de l'art, ta problématique et ton équipe.
          </p>
          <Link href="/app/projects/new">
            <Button size="lg">Créer mon premier projet</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Link
              key={p.id + p.role}
              href={`/app/projects/${p.id}`}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 hover:border-[var(--color-burgundy)] hover:shadow-sm transition-all flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="font-serif text-xl font-semibold text-[var(--color-ink)] truncate">
                  {p.title}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)] mt-1 flex flex-wrap gap-x-3">
                  {p.discipline && <span>{p.discipline}</span>}
                  {p.level && <span>{formatLevel(p.level)}</span>}
                  <span>Modifié {formatDateRelative(p.updated_at)}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${roleStyle(p.role)}`}>
                {roleLabel(p.role)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatLevel(level: string) {
  return ({ m1: "Master 1", m2: "Master 2", doctorat: "Doctorat", autre: "Autre" } as Record<string, string>)[level] || level;
}

function roleLabel(role: string) {
  return ({ owner: "Propriétaire", author: "Auteur", director: "Directeur", reader: "Lecteur" } as Record<string, string>)[role] || role;
}

function roleStyle(role: string) {
  return ({
    owner: "bg-[var(--color-burgundy)] text-white",
    author: "bg-[var(--color-cream)] border border-[var(--color-line)] text-[var(--color-ink)]",
    director: "bg-[var(--color-forest)] text-white",
    reader: "bg-[var(--color-line-soft)] text-[var(--color-ink-soft)]",
  } as Record<string, string>)[role] || "bg-[var(--color-cream)]";
}
