import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODELS, systemBlocks } from "@/lib/anthropic";

export const maxDuration = 60;

const Body = z.object({
  context: z.object({
    title: z.string().max(300),
    discipline: z.string().max(100),
    problematique: z.string().max(2000),
  }),
  searchCount: z.number().int().min(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const feedback = await generateReview(payload);

  const { data: row, error } = await supabase
    .from("reviews")
    .insert({
      project_id: projectId,
      user_id: user.id,
      feedback,
    })
    .select("id")
    .single();

  if (error) {
    console.error("review insert", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ id: row.id, feedback });
}

async function generateReview(payload: z.infer<typeof Body>): Promise<unknown> {
  const client = anthropic();

  const userMsg = `Contexte du projet de recherche :
Titre : ${payload.context.title}
Discipline : ${payload.context.discipline}
Problématique : "${payload.context.problematique}"
Nombre de sources état de l'art retenues : ${payload.searchCount}

Tâche : produis une RELECTURE MÉTHODOLOGIQUE du projet de recherche. Tu analyseras :
1. Clarté et défendabilité de la problématique
2. Pertinence de l'approche pour la discipline
3. Couverture de la littérature (suffisant ? lacunes attendues ?)
4. Faisabilité et scope réaliste pour ce niveau d'étude
5. Points forts à approfondir
6. Risques méthodologiques à surveiller

Pour chaque section :
- Un titre court
- 2-4 bullets télégraphiques (jamais de prose)
- Toujours constructif et encourageant (c'est un coach, pas un juge)

CONTRAINTE ABSOLUE : tu écris UNIQUEMENT en bullets et titres courts. JAMAIS de paragraphes en prose.

Réponds STRICTEMENT en JSON valide :
{
  "sections": [
    {
      "title": "...",
      "bullets": ["...", "...", "..."]
    },
    ...
  ]
}

PAS de markdown, PAS de prose, PAS de texte hors JSON.`;

  try {
    const res = await client.messages.create({
      model: MODELS.fast,
      max_tokens: 1500,
      system: systemBlocks(),
      messages: [{ role: "user", content: userMsg }],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const parsed = parseJsonLoose(text);
    const sections = parsed?.sections;
    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error("Format invalide retourné par le LLM");
    }
    // sanitize
    return {
      sections: sections.slice(0, 6).map((s: any) => ({
        title: String(s.title ?? "").trim(),
        bullets: Array.isArray(s.bullets)
          ? s.bullets.slice(0, 5).map((b: any) => String(b).trim()).filter(Boolean)
          : [],
      })),
    };
  } catch (e) {
    console.error("review gen error", e);
    throw new Error(
      "Échec génération. Réessaie dans un instant — la consigne anti-prose est stricte.",
    );
  }
}

function parseJsonLoose(text: string): any {
  try {
    return JSON.parse(text);
  } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}
