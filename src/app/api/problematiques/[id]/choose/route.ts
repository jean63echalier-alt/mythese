import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ chosen: z.string().min(2).max(2000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Update problematiques.chosen
  const { data: pb, error: e1 } = await supabase
    .from("problematiques")
    .update({ chosen: payload.chosen })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("project_id")
    .single();

  if (e1 || !pb) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  // Mirror chosen problematique to project (so it's visible everywhere)
  await supabase
    .from("projects")
    .update({ problematique: payload.chosen })
    .eq("id", pb.project_id);

  return NextResponse.json({ ok: true });
}
