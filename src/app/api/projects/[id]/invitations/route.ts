import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailInvitation } from "@/lib/resend";

const Body = z.object({
  email: z.string().email().max(200),
  role: z.enum(["author", "director", "reader"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Verify owner
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, owner_id")
    .eq("id", projectId)
    .single();
  if (!project || project.owner_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      project_id: projectId,
      email: payload.email.toLowerCase(),
      role: payload.role,
      invited_by: user.id,
    })
    .select("id, token")
    .single();

  if (error || !invite) {
    console.error("invite create error", error);
    return NextResponse.json({ error: "Erreur création invitation" }, { status: 500 });
  }

  // Send email
  const origin =
    new URL(req.url).origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://mythese.com";
  const inviteUrl = `${origin}/invite/${invite.token}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single();
  const inviterName =
    profile?.full_name || user.email?.split("@")[0] || "Quelqu'un";

  sendEmail(
    emailInvitation({
      email: payload.email,
      inviterName,
      projectTitle: project.title,
      role: payload.role,
      inviteUrl,
    }),
  ).catch((e) => console.error("invite email send", e));

  return NextResponse.json({ ok: true, id: invite.id });
}
