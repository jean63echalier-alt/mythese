import { createClient, createAdminClient } from "@/lib/supabase/server";
import { InviteForm } from "./_invite-form";
import { formatDateRelative } from "@/lib/utils";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", id)
    .single();

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id, role, created_at")
    .eq("project_id", id);

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, role, created_at, accepted, expires_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Owner can manage; lookup display info via admin to avoid RLS on auth.users
  const admin = createAdminClient();
  const memberUserIds = [project?.owner_id, ...((members ?? []).map((m) => m.user_id))].filter(Boolean) as string[];
  const memberInfos: Record<string, { email: string; full_name: string | null }> = {};
  if (memberUserIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", memberUserIds);
    for (const p of profs ?? []) memberInfos[p.user_id] = { email: "", full_name: p.full_name };
    // get emails
    for (const uid of memberUserIds) {
      const { data: u } = await admin.auth.admin.getUserById(uid);
      if (u?.user) {
        memberInfos[uid] = {
          email: u.user.email ?? "",
          full_name: memberInfos[uid]?.full_name ?? (u.user.user_metadata?.full_name ?? null),
        };
      }
    }
  }

  const isOwner = project?.owner_id === user!.id;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-xl font-semibold mb-3">Membres</h2>
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] divide-y divide-[var(--color-line-soft)]">
          {/* Owner row */}
          <div className="px-5 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">
                {memberInfos[project!.owner_id]?.full_name ?? memberInfos[project!.owner_id]?.email ?? "Propriétaire"}
                {project!.owner_id === user!.id && <span className="text-xs text-[var(--color-ink-muted)]"> (toi)</span>}
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                {memberInfos[project!.owner_id]?.email}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-[var(--color-burgundy)] text-white">
              Propriétaire
            </span>
          </div>
          {(members ?? []).map((m) => (
            <div key={m.user_id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {memberInfos[m.user_id]?.full_name ?? memberInfos[m.user_id]?.email ?? m.user_id.slice(0, 8)}
                  {m.user_id === user!.id && <span className="text-xs text-[var(--color-ink-muted)]"> (toi)</span>}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">
                  {memberInfos[m.user_id]?.email} · ajouté {formatDateRelative(m.created_at)}
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[var(--color-cream)] border border-[var(--color-line)]">
                {roleLabel(m.role)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {isOwner && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-1">Inviter un collaborateur</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-4">
            Chacun reçoit un email avec un lien magique vers le projet. Auteur = écrit, directeur = commente, lecteur = lit.
          </p>
          <InviteForm projectId={id} />
        </section>
      )}

      {(invitations?.length ?? 0) > 0 && isOwner && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-3">Invitations en attente</h2>
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] divide-y divide-[var(--color-line-soft)]">
            {(invitations ?? []).map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    {roleLabel(inv.role)} · envoyée {formatDateRelative(inv.created_at)}
                    {inv.accepted ? " · ✓ acceptée" : ""}
                  </div>
                </div>
                {!inv.accepted && (
                  <span className="text-xs text-[var(--color-ink-muted)]">en attente</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function roleLabel(role: string) {
  return ({ owner: "Propriétaire", author: "Auteur", director: "Directeur", reader: "Lecteur" } as Record<string, string>)[role] || role;
}
