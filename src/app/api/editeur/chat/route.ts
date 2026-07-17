import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODELS, systemBlocks, directeurSystemBlocks } from "@/lib/anthropic";

export const maxDuration = 30;

const Body = z.object({
  message: z.string().min(1).max(2000),
  persona: z.enum(["coach", "directeur"]).default("coach"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        contenu: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .default([]),
  sectionNom: z.string().min(1).max(120),
  sectionContenu: z.string().max(12000).optional(),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const contexte = payload.sectionContenu
    ? `\n\nContenu actuel de la section (HTML) :\n${payload.sectionContenu}`
    : "";

  const messages = [
    ...payload.history.map((m) => ({ role: m.role, content: m.contenu })),
    {
      role: "user" as const,
      content: `Section en cours : "${payload.sectionNom}"${contexte}\n\nQuestion de l'étudiant : "${payload.message}"`,
    },
  ];

  try {
    const client = anthropic();
    const res = await client.messages.create({
      model: MODELS.reasoning,
      max_tokens: 700,
      system: payload.persona === "directeur" ? directeurSystemBlocks() : systemBlocks(),
      messages,
    });
    const reponse = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!reponse) throw new Error("Réponse vide");
    return NextResponse.json({ reponse });
  } catch (e) {
    console.error("editeur/chat", e);
    return NextResponse.json({ error: "Avis indisponible — réessaie." }, { status: 500 });
  }
}
