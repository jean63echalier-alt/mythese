import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invitations")
    .select("id, project_id, email, role, expires_at, accepted, project:projects(title)")
    .eq("token", token)
    .single();

  if (!invite) {
    return (
      <Centered>
        <h1 className="font-serif text-3xl font-semibold">Invitation invalide</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-2">
          Ce lien d'invitation n'existe pas ou a été révoqué.
        </p>
        <Link href="/" className="mt-6 inline-block underline">Retour à l'accueil</Link>
      </Centered>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <Centered>
        <h1 className="font-serif text-3xl font-semibold">Invitation expirée</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-2">
          Demande à la personne qui t'a invité de t'envoyer un nouveau lien.
        </p>
      </Centered>
    );
  }

  if (invite.accepted) {
    if (user) redirect(`/app/projects/${invite.project_id}`);
    return (
      <Centered>
        <h1 className="font-serif text-3xl font-semibold">Déjà acceptée</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-2">
          Connecte-toi pour voir le projet.
        </p>
        <Link href={`/login?next=/app/projects/${invite.project_id}`} className="mt-6 inline-block">
          <Button>Se connecter</Button>
        </Link>
      </Centered>
    );
  }

  // If user not logged in : redirect to login with return URL
  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  // User logged in — show accept button
  const projectTitle = (invite.project as any)?.title ?? "ce projet";
  return (
    <Centered>
      <h1 className="font-serif text-3xl font-semibold">Tu es invité</h1>
      <p className="text-sm text-[var(--color-ink-soft)] mt-2 mb-6">
        Tu rejoindras le projet <strong>{projectTitle}</strong> en tant que <strong>{roleLabel(invite.role)}</strong>.
      </p>
      <form action={`/api/invitations/${token}/accept`} method="POST">
        <Button type="submit" size="lg">Accepter l'invitation</Button>
      </form>
      <p className="text-xs text-[var(--color-ink-muted)] mt-3">
        Connecté en tant que <strong>{user.email}</strong>.
      </p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center max-w-md">{children}</div>
    </div>
  );
}

function roleLabel(role: string) {
  return ({ author: "Auteur", director: "Directeur", reader: "Lecteur" } as Record<string, string>)[role] || role;
}
