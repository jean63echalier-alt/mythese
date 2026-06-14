import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODELS } from "@/lib/anthropic";
import { openai, GPT_MODEL } from "@/lib/openai";
import { ETAPES, claudeAdvicePrompt, gptAdvicePrompt, synthesePrompt } from "@/lib/plan";

export const maxDuration = 60;

const Body = z.object({
  etape_id: z.number().int().min(1).max(6),
  texte_soumis: z.string().min(1).max(20_000),
  question: z.string().min(1).max(1000),
});

const ERREUR_INDISPONIBLE = "Avis indisponible — l'IA n'a pas pu répondre cette fois.";

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

  const etape = ETAPES.find((e) => e.id === payload.etape_id);
  if (!etape) return NextResponse.json({ error: "Étape inconnue" }, { status: 400 });

  const { data: soumission, error: subError } = await supabase
    .from("soumissions")
    .insert({
      user_id: user.id,
      etape_id: payload.etape_id,
      type_contenu: "texte",
      contenu_extrait: payload.texte_soumis,
    })
    .select("id")
    .single();

  if (subError) {
    console.error("soumission insert", subError);
    return NextResponse.json({ error: "Erreur serveur (soumission)" }, { status: 500 });
  }

  const [claudeResult, gptResult] = await Promise.allSettled([
    askClaude(claudeAdvicePrompt(etape.titre, payload.texte_soumis, payload.question)),
    askGpt(gptAdvicePrompt(etape.titre, payload.texte_soumis, payload.question)),
  ]);

  const avisClaude = claudeResult.status === "fulfilled" ? claudeResult.value : ERREUR_INDISPONIBLE;
  const avisGpt = gptResult.status === "fulfilled" ? gptResult.value : ERREUR_INDISPONIBLE;
  if (claudeResult.status === "rejected") console.error("avis claude", claudeResult.reason);
  if (gptResult.status === "rejected") console.error("avis gpt", gptResult.reason);

  let synthese = ERREUR_INDISPONIBLE;
  if (claudeResult.status === "fulfilled" || gptResult.status === "fulfilled") {
    try {
      synthese = await askClaude(synthesePrompt(etape.titre, avisClaude, avisGpt));
    } catch (e) {
      console.error("synthese", e);
    }
  }

  const { error: conseilError } = await supabase.from("conseils_ia").insert({
    soumission_id: soumission.id,
    avis_claude: avisClaude,
    avis_gpt: avisGpt,
    synthese,
  });
  if (conseilError) console.error("conseil insert", conseilError);

  return NextResponse.json({ avis_claude: avisClaude, avis_gpt: avisGpt, synthese });
}

async function askClaude(prompt: string): Promise<string> {
  const client = anthropic();
  const res = await client.messages.create({
    model: MODELS.reasoning,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

async function askGpt(prompt: string): Promise<string> {
  const client = openai();
  const res = await client.chat.completions.create({
    model: GPT_MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
