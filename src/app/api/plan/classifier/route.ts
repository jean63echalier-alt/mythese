import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODELS } from "@/lib/anthropic";
import { extractText } from "@/lib/extractors";
import { CLASSIFIER_SYSTEM_PROMPT, statutFromLabel } from "@/lib/plan";
import { parseJsonLoose } from "@/lib/utils";
import { isAccountUnlocked } from "@/lib/gate";

export const maxDuration = 60;

const MAX_CHARS = 20_000;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!(await isAccountUnlocked(supabase, user.id))) {
    return NextResponse.json(
      { error: "quota_exceeded", message: "Le Plan de recherche nécessite un déblocage (39€ ou 19€/mois)." },
      { status: 402 },
    );
  }

  const form = await req.formData();
  const texte = form.get("texte");
  const fichier = form.get("fichier");

  let extracted: { text: string; type: "texte" | "pdf" | "docx" | "image" | "audio" };
  try {
    if (fichier instanceof File) {
      const buffer = Buffer.from(await fichier.arrayBuffer());
      extracted = await extractText({ buffer, mimeType: fichier.type, filename: fichier.name });
    } else if (typeof texte === "string" && texte.trim()) {
      extracted = { text: texte, type: "texte" };
    } else {
      return NextResponse.json({ error: "Aucun contenu soumis (texte ou fichier requis)" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Extraction impossible" }, { status: 400 });
  }

  const contenu = extracted.text.trim().slice(0, MAX_CHARS);
  if (!contenu) {
    return NextResponse.json({ error: "Contenu vide après extraction" }, { status: 400 });
  }

  let etapesResult: { id: number; statut: string; justification: string }[];
  try {
    etapesResult = await classify(contenu);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Classification impossible" }, { status: 502 });
  }

  const primaryEtapeId = etapesResult[0]?.id ?? null;

  const { data: soumission, error: subError } = await supabase
    .from("soumissions")
    .insert({
      user_id: user.id,
      etape_id: primaryEtapeId,
      type_contenu: extracted.type,
      contenu_extrait: contenu,
    })
    .select("id")
    .single();

  if (subError) {
    console.error("soumission insert", subError);
    return NextResponse.json({ error: "Erreur serveur (soumission)" }, { status: 500 });
  }

  for (const e of etapesResult) {
    const { error: progError } = await supabase
      .from("etudiant_progression")
      .upsert(
        {
          user_id: user.id,
          etape_id: e.id,
          statut: statutFromLabel(e.statut),
          resume_ia: e.justification,
          derniere_maj: new Date().toISOString(),
        },
        { onConflict: "user_id,etape_id" },
      );
    if (progError) console.error("progression upsert", progError);
  }

  return NextResponse.json({ soumission_id: soumission.id, etapes: etapesResult });
}

async function classify(contenu: string): Promise<{ id: number; statut: string; justification: string }[]> {
  const client = anthropic();
  const res = await client.messages.create({
    model: MODELS.fast,
    max_tokens: 1024,
    system: CLASSIFIER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Contenu soumis :\n\n"""\n${contenu}\n"""` }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = parseJsonLoose(text) as { etapes?: unknown } | null;
  const etapes = parsed?.etapes;
  if (!Array.isArray(etapes) || etapes.length === 0) {
    throw new Error("Format invalide retourné par le LLM");
  }
  return etapes
    .map((e) => {
      const obj = e as Record<string, unknown>;
      const id = Number(obj.id);
      return {
        id,
        statut: String(obj.statut ?? ""),
        justification: String(obj.justification ?? "").trim(),
      };
    })
    .filter((e) => Number.isInteger(e.id) && e.id >= 1 && e.id <= 6);
}
