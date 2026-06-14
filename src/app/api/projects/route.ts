import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailAdminNotify } from "@/lib/resend";

const Body = z.object({
  title: z.string().min(2).max(200),
  discipline: z.string().max(100).optional(),
  level: z.enum(["m1", "m2", "doctorat", "autre"]).default("autre"),
  problematique: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title: payload.title,
      discipline: payload.discipline ?? null,
      level: payload.level,
      problematique: payload.problematique?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("project create error", error);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }

  sendEmail(
    emailAdminNotify({
      subject: "Nouveau projet créé",
      lines: [
        ["Titre", payload.title],
        ["Niveau", payload.level],
        ["Discipline", payload.discipline ?? "-"],
        ["Utilisateur", user.email ?? user.id],
      ],
    }),
  ).catch((e) => console.error("project admin notify error", e));

  return NextResponse.json({ id: data.id });
}
