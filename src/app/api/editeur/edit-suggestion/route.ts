import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anthropic, editSystemBlocks, MODELS } from "@/lib/anthropic";
import { parseJsonLoose } from "@/lib/utils";

export const maxDuration = 30;

const Body = z.object({
  blocHtml: z.string().min(1).max(4000),
  selectionTexte: z.string().min(1).max(1000),
  instruction: z.string().min(1).max(500),
  sectionNom: z.string().min(1).max(120),
});

const Result = z.object({
  html: z.string().min(1),
  resume: z.string().min(1),
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

  const prompt = `Section : "${payload.sectionNom}"
Passage sélectionné par l'étudiant : "${payload.selectionTexte}"
Instruction de l'étudiant : "${payload.instruction}"

Bloc HTML à retoucher :
${payload.blocHtml}`;

  try {
    const client = anthropic();
    const res = await client.messages.create({
      model: MODELS.reasoning,
      max_tokens: 800,
      system: editSystemBlocks(),
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const parsed = Result.safeParse(parseJsonLoose(text));
    if (!parsed.success) {
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 500 });
    }
    return NextResponse.json(parsed.data);
  } catch (e) {
    console.error("edit-suggestion", e);
    return NextResponse.json({ error: "Suggestion indisponible" }, { status: 500 });
  }
}
