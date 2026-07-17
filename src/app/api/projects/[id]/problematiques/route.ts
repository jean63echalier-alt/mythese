import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODELS, systemBlocks } from "@/lib/anthropic";
import { checkGate } from "@/lib/gate";

export const maxDuration = 60;

const Body = z.object({
  answers: z.record(z.string(), z.string().max(2000)),
  context: z.object({
    title: z.string().max(300),
    discipline: z.string().max(100),
    problematique: z.string().max(2000),
  }),
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

  const gate = await checkGate(supabase, user.id, projectId, "problematiques");
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", message: "Ta problématique gratuite sur ce projet a déjà été générée." },
      { status: 402 },
    );
  }

  const proposals = await generateProposals(payload);

  const { data: row, error } = await supabase
    .from("problematiques")
    .insert({
      project_id: projectId,
      user_id: user.id,
      answers: payload.answers,
      proposals,
    })
    .select("id")
    .single();

  if (error) {
    console.error("problematique insert", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ id: row.id, proposals });
}

async function generateProposals(payload: z.infer<typeof Body>): Promise<unknown[]> {
  const client = anthropic();

  const userMsg = `Contexte du projet :
Titre : ${payload.context.title}
Discipline : ${payload.context.discipline}
${payload.context.problematique ? `Problématique pressentie : "${payload.context.problematique}"` : ""}

Réponses de l'étudiant aux 8 questions socratiques :

1. Phénomène qui interroge : ${payload.answers.phenomene ?? "(non renseigné)"}
2. Pourquoi maintenant : ${payload.answers.pourquoi_maintenant ?? "(non renseigné)"}
3. Pour qui c'est important : ${payload.answers.pour_qui ?? "(non renseigné)"}
4. Angle unique observé : ${payload.answers.angle_unique ?? "(non renseigné)"}
5. Hypothèses concurrentes : ${payload.answers.hypotheses ?? "(non renseigné)"}
6. Discipline qui éclaire : ${payload.answers.discipline ?? "(non renseigné)"}
7. Concepts clés à mobiliser : ${payload.answers.concepts ?? "(non renseigné)"}
8. Angle à défendre : ${payload.answers.angle_defendre ?? "(non renseigné)"}

Tâche : produis 3 propositions DISTINCTES de problématique reformulée, chacune avec plan binaire OU ternaire détaillé.

Pour chaque proposition :
- Une formulation interrogative claire et défendable (1 question, 1-2 lignes max)
- Plan : 2 ou 3 parties (alterner entre les propositions)
- Pour chaque partie : titre + 2-3 bullets télégraphiques expliquant le contenu/argument

CONTRAINTE ABSOLUE : tu écris UNIQUEMENT en bullets et titres courts. JAMAIS de paragraphes en prose.

Réponds STRICTEMENT en JSON valide :
{
  "proposals": [
    {
      "letter": "A",
      "problematique": "...",
      "planType": "binaire" | "ternaire",
      "parts": [
        { "title": "...", "bullets": ["...", "...", "..."] },
        ...
      ]
    },
    { "letter": "B", ... },
    { "letter": "C", ... }
  ]
}

PAS de markdown, PAS de prose, PAS de texte hors JSON.`;

  try {
    const res = await client.messages.create({
      model: MODELS.reasoning,
      max_tokens: 3500,
      system: systemBlocks(),
      messages: [{ role: "user", content: userMsg }],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const parsed = parseJsonLoose(text);
    const proposals = parsed?.proposals;
    if (!Array.isArray(proposals) || proposals.length === 0) {
      throw new Error("Format invalide retourné par le LLM");
    }
    // sanitize
    return proposals.slice(0, 3).map((p: any, i: number) => ({
      letter: p.letter ?? ["A", "B", "C"][i],
      problematique: String(p.problematique ?? "").trim(),
      planType: p.planType === "ternaire" ? "ternaire" : "binaire",
      parts: Array.isArray(p.parts)
        ? p.parts.slice(0, 3).map((pp: any) => ({
            title: String(pp.title ?? "").trim(),
            bullets: Array.isArray(pp.bullets)
              ? pp.bullets.slice(0, 4).map((b: any) => String(b).trim()).filter(Boolean)
              : [],
          }))
        : [],
    }));
  } catch (e) {
    console.error("proposals gen error", e);
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
