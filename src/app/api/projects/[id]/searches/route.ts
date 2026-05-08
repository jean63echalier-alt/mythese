import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { searchWorks } from "@/lib/openalex";
import { anthropic, MODELS, systemBlocks } from "@/lib/anthropic";

export const maxDuration = 60;

const Body = z.object({
  topic: z.string().min(3).max(300),
  keywords: z.array(z.string().min(1).max(50)).min(2).max(8),
  problematique: z.string().max(2000).optional(),
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

  // 1. Reformuler les mots-clés en query OpenAlex via Haiku
  const queryStr = await reformulateQuery(payload);

  // 2. Appeler OpenAlex
  const works = await searchWorks({ search: queryStr, perPage: 30 });

  if (works.length === 0) {
    return NextResponse.json(
      {
        error:
          "Aucun résultat OpenAlex sur cette requête. Essaie des mots-clés plus généraux ou en anglais (la plupart des publis scientifiques sont en EN).",
      },
      { status: 404 },
    );
  }

  // 3. Pour chaque source : résumé + pertinence via Sonnet (parallèle, batch concis)
  const enriched = await enrichWorks(works.slice(0, 20), payload.problematique || "");

  // 4. Sauvegarder
  const { error: insertError } = await supabase.from("searches").insert({
    project_id: projectId,
    user_id: user.id,
    query: queryStr,
    keywords: payload.keywords,
    problematique: payload.problematique || null,
    results: enriched,
  });
  if (insertError) {
    console.error("search insert", insertError);
  }

  return NextResponse.json({ query: queryStr, results: enriched });
}

async function reformulateQuery(payload: z.infer<typeof Body>): Promise<string> {
  const client = anthropic();
  try {
    const res = await client.messages.create({
      model: MODELS.fast,
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: "Tu reformules des mots-clés en query OpenAlex courte et efficace. RÈGLE STRICTE : maximum 6 mots, en anglais (la majorité des papers OpenAlex sont en anglais), pas de guillemets, pas d'opérateurs booléens. Tu réponds UNIQUEMENT avec la query brute, sans explication.",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Sujet : ${payload.topic}
Mots-clés : ${payload.keywords.join(", ")}${payload.problematique ? `\nProblématique : ${payload.problematique}` : ""}

Reformule en 4 à 6 mots anglais maximum.`,
        },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join(" ")
      .trim();
    return text || `${payload.topic} ${payload.keywords.join(" ")}`;
  } catch (e) {
    console.error("reformulate fallback", e);
    return `${payload.topic} ${payload.keywords.join(" ")}`;
  }
}

interface EnrichedWork {
  doi: string | null;
  doiUrl: string | null;
  title: string;
  year: number | null;
  authors: string[];
  journal: string | null;
  citations: number;
  citationApa: string;
  summary: string[];
  pertinence: string[];
}

async function enrichWorks(
  works: import("@/lib/openalex").NormalizedWork[],
  problematique: string,
): Promise<EnrichedWork[]> {
  const client = anthropic();

  // Batch toutes les sources en un seul appel pour rapidité + cache
  const sources = works.map((w, i) => ({
    n: i + 1,
    title: w.title,
    abstract: (w.abstract || "").slice(0, 1200),
    authors: w.authors.slice(0, 5).join(", "),
    year: w.year,
    journal: w.journal,
  }));

  const userMsg = `Voici ${sources.length} sources scientifiques retournées par OpenAlex.

${sources
  .map(
    (s) =>
      `[${s.n}] ${s.title} (${s.year ?? "s.d."}) — ${s.authors}${s.journal ? ` · ${s.journal}` : ""}
Abstract : ${s.abstract || "(pas d'abstract)"}`,
  )
  .join("\n\n")}

${problematique ? `Problématique de l'étudiant : "${problematique}"` : "L'étudiant n'a pas encore formulé de problématique."}

Pour CHAQUE source, produis EN BULLETS UNIQUEMENT (jamais de prose) :
- "summary" : 3-4 bullets max, télégraphique, en français, qui résument la source
- "pertinence" : 1-2 bullets max, qui expliquent pourquoi cette source est pertinente vs la problématique${!problematique ? " (ou vs le sujet général si pas de pb)" : ""}

Réponds STRICTEMENT en JSON valide, format :
{ "items": [ { "n": 1, "summary": ["...", "..."], "pertinence": ["..."] }, ... ] }

PAS de markdown, PAS de prose hors du JSON, PAS de texte avant/après le JSON.`;

  try {
    // Module 1 enrich = tâche structurée (résumé + pertinence). Haiku suffit, plus rapide.
    const res = await client.messages.create({
      model: MODELS.fast,
      max_tokens: 4000,
      system: systemBlocks(),
      messages: [{ role: "user", content: userMsg }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    const parsed = parseJsonLoose(text);
    const items: Array<{ n: number; summary: string[]; pertinence: string[] }> = parsed?.items ?? [];

    return works.map((w, i) => {
      const item = items.find((it) => it.n === i + 1);
      return {
        doi: w.doi,
        doiUrl: w.doiUrl,
        title: w.title,
        year: w.year,
        authors: w.authors,
        journal: w.journal,
        citations: w.citations,
        citationApa: w.citationApa,
        summary: item?.summary?.slice(0, 4) ?? bulletsFromAbstract(w.abstract),
        pertinence: item?.pertinence?.slice(0, 2) ?? [],
      };
    });
  } catch (e) {
    console.error("enrich error", e);
    // Fallback sans IA : juste les abstracts
    return works.map((w) => ({
      doi: w.doi,
      doiUrl: w.doiUrl,
      title: w.title,
      year: w.year,
      authors: w.authors,
      journal: w.journal,
      citations: w.citations,
      citationApa: w.citationApa,
      summary: bulletsFromAbstract(w.abstract),
      pertinence: [],
    }));
  }
}

function bulletsFromAbstract(abs: string | null): string[] {
  if (!abs) return ["(résumé non disponible)"];
  return abs
    .split(/(?<=[.!?])\s+/)
    .slice(0, 3)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseJsonLoose(text: string): any {
  // Essaye le JSON direct, sinon extrait le premier bloc { ... }
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
