import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?next=/invite/${token}`,
      { status: 303 },
    );
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invitations")
    .select("id, project_id, role, expires_at, accepted")
    .eq("token", token)
    .single();

  if (!invite) {
    return NextResponse.redirect(`${origin}/?error=invite_invalid`, { status: 303 });
  }
  if (invite.accepted || new Date(invite.expires_at) < new Date()) {
    return NextResponse.redirect(`${origin}/app/projects/${invite.project_id}`, { status: 303 });
  }

  await admin.from("project_members").upsert(
    {
      project_id: invite.project_id,
      user_id: user.id,
      role: invite.role,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "project_id,user_id" },
  );
  await admin.from("invitations").update({
    accepted: true,
    accepted_at: new Date().toISOString(),
    accepted_by: user.id,
  }).eq("id", invite.id);

  return NextResponse.redirect(`${origin}/app/projects/${invite.project_id}`, { status: 303 });
}
