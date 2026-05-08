import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectTabs } from "./_tabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, discipline, level, problematique, owner_id")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Determine user role
  const isOwner = project.owner_id === user.id;
  let role: "owner" | "author" | "director" | "reader" = isOwner ? "owner" : "reader";
  if (!isOwner) {
    const { data: m } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .single();
    if (!m) notFound();
    role = m.role;
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <Link
        href="/app"
        className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← Mes projets
      </Link>
      <div className="mt-3 mb-1 flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold leading-tight">
          {project.title}
        </h1>
        <span className={`text-xs px-2 py-1 rounded shrink-0 ${roleStyle(role)}`}>
          {roleLabel(role)}
        </span>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] mb-6">
        {[
          project.discipline,
          project.level && formatLevel(project.level),
        ].filter(Boolean).join(" · ")}
      </p>

      <ProjectTabs projectId={id} />

      <div className="mt-8">{children}</div>
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
  } as Record<string, string>)[role] || "";
}
