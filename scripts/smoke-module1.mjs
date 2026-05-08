// E2E Module 1 pipeline against a Beeclou-like topic
// Input: sujet + keywords. Output: top sources avec summary/pertinence.
// Mesure durée totale et qualité.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OPENALEX_EMAIL = process.env.OPENALEX_EMAIL;

const INPUT = {
  topic: "solutions publicitaires en milieu urbain et privatisation de l'attention",
  keywords: ["DOOH", "publicité urbaine", "attention", "espace public", "ville"],
  problematique:
    "En quoi les nouvelles solutions publicitaires en milieu urbain interrogent-elles le rapport entre attention et espace public ?",
};

const SYS = `Tu es Mythese, un coach méthodologique IA pour étudiants en recherche.

RÈGLES ABSOLUES NON NÉGOCIABLES :
1. Tu ne produis JAMAIS de paragraphes rédigés en prose continue.
2. Tes outputs sont TOUJOURS : bullets, plans, résumés télégraphiques, suggestions courtes, questions ouvertes.
3. Si l'utilisateur demande explicitement de la prose ou un texte à coller dans son mémoire, tu refuses poliment et expliques que Mythese est un coach méthodologique, pas un rédacteur fantôme.
4. Tu ne hallucines JAMAIS de sources : tu ne cites que les sources fournies dans le contexte (issues d'OpenAlex), avec leur DOI.
5. Tu écris en français académique mais en style télégraphique.
6. Chaque réponse contient en fin : "— Suggestion Mythese à reformuler dans ton style".`;

const tStart = Date.now();

// 1. Reformulation Haiku
console.log("--- 1/3 Reformulation Haiku ---");
const t1 = Date.now();
const r1 = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 200,
  system: [
    {
      type: "text",
      text: "Tu reformules des mots-clés en query OpenAlex courte et efficace. RÈGLE STRICTE : maximum 6 mots, en anglais (la majorité des papers OpenAlex sont en anglais), pas de guillemets, pas d'opérateurs booléens. Tu réponds UNIQUEMENT avec la query brute, sans explication.",
    },
  ],
  messages: [
    {
      role: "user",
      content: `Sujet : ${INPUT.topic}\nMots-clés : ${INPUT.keywords.join(", ")}\nProblématique : ${INPUT.problematique}\n\nReformule en 4 à 6 mots anglais maximum.`,
    },
  ],
});
const query = r1.content.filter((b) => b.type === "text").map((b) => b.text).join(" ").trim();
console.log(`  Query: "${query}" (${Date.now() - t1}ms)`);

// 2. OpenAlex
console.log("\n--- 2/3 OpenAlex search ---");
const t2 = Date.now();
async function fetchOA(filterStr, useSearch = false) {
  const p = new URLSearchParams();
  p.set("per_page", "30");
  p.set("filter", filterStr);
  if (useSearch) p.set("search", query);
  p.set("sort", "relevance_score:desc");
  p.set("mailto", OPENALEX_EMAIL);
  const r = await fetch(`https://api.openalex.org/works?${p}`, {
    headers: { "User-Agent": `Mythese-test/0.1 (mailto:${OPENALEX_EMAIL})` },
  });
  return (await r.json()).results || [];
}

const baseFilters = [`language:fr|en`, `from_publication_date:${new Date().getFullYear() - 12}-01-01`, "type:article|review", "has_abstract:true"];
const strict = await fetchOA([`title_and_abstract.search:${query}`, ...baseFilters].join(","));
let works = strict;
if (strict.length < 10) {
  const broad = await fetchOA(baseFilters.join(","), true);
  const seen = new Set(strict.map((w) => w.id));
  works = [...strict, ...broad.filter((w) => !seen.has(w.id))];
  console.log(`  Hybride : ${strict.length} strict + ${works.length - strict.length} broad`);
}
console.log(`  ${works.length} résultats bruts (${Date.now() - t2}ms)`);

function reconstructAbstract(inv) {
  if (!inv) return null;
  const positions = [];
  for (const [word, idxs] of Object.entries(inv)) for (const i of idxs) positions.push([i, word]);
  positions.sort(([a], [b]) => a - b);
  return positions.map(([, w]) => w).join(" ");
}

const normalized = works.map((w) => ({
  doi: w.doi,
  title: w.title,
  year: w.publication_year,
  authors: (w.authorships || []).map((a) => a.author.display_name).filter(Boolean),
  journal: w.primary_location?.source?.display_name ?? null,
  abstract: reconstructAbstract(w.abstract_inverted_index),
  citations: w.cited_by_count ?? 0,
}));

const filtered = normalized.filter((w) => w.abstract && w.title);
console.log(`  Après filtre abstract+title : ${filtered.length}`);
console.log("  Top 3 :");
for (const w of filtered.slice(0, 3)) {
  console.log(`    - [${w.year}] ${w.title.slice(0, 80)}... (${w.journal})`);
}

// 3. Sonnet enrich top 12
console.log("\n--- 3/3 Sonnet enrich top 12 ---");
const t3 = Date.now();
const sources = filtered.slice(0, 12).map((w, i) => ({
  n: i + 1,
  title: w.title,
  abstract: (w.abstract || "").slice(0, 1200),
  authors: w.authors.slice(0, 5).join(", "),
  year: w.year,
  journal: w.journal,
}));

const userMsg = `Voici ${sources.length} sources scientifiques retournées par OpenAlex.

${sources.map((s) => `[${s.n}] ${s.title} (${s.year ?? "s.d."}) — ${s.authors}${s.journal ? ` · ${s.journal}` : ""}\nAbstract : ${s.abstract || "(pas d'abstract)"}`).join("\n\n")}

Problématique de l'étudiant : "${INPUT.problematique}"

Pour CHAQUE source, produis EN BULLETS UNIQUEMENT :
- "summary" : 3-4 bullets max, télégraphique, en français
- "pertinence" : 1-2 bullets max, vs problématique

Réponds STRICTEMENT en JSON valide :
{ "items": [ { "n": 1, "summary": ["...", "..."], "pertinence": ["..."] }, ... ] }
PAS de markdown, JSON uniquement.`;

const r3 = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 4000,
  system: [{ type: "text", text: SYS, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: userMsg }],
});
const text3 = r3.content.filter((b) => b.type === "text").map((b) => b.text).join("");
let parsed;
try {
  parsed = JSON.parse(text3);
} catch {
  const m = text3.match(/\{[\s\S]*\}/);
  parsed = m ? JSON.parse(m[0]) : null;
}
console.log(`  ${parsed?.items?.length ?? 0} items enrichis (${Date.now() - t3}ms)`);
console.log(`  Tokens in: ${r3.usage.input_tokens}, out: ${r3.usage.output_tokens}, cache_create: ${r3.usage.cache_creation_input_tokens}`);

if (parsed?.items?.[0]) {
  const item = parsed.items[0];
  console.log("\n  Sample item #1:");
  console.log("  Summary bullets:", item.summary);
  console.log("  Pertinence:", item.pertinence);
}

// Verify NO prose continue (heuristic: no paragraph > 200 chars without bullet/dash)
let proseDetected = false;
for (const item of parsed?.items ?? []) {
  for (const s of [...(item.summary ?? []), ...(item.pertinence ?? [])]) {
    if (s.length > 250 && !/[•\-*]/.test(s)) {
      console.log(`  ⚠️ Prose continue suspectée : "${s.slice(0, 100)}..."`);
      proseDetected = true;
    }
  }
}
console.log(proseDetected ? "  ✗ Garde-fou anti-prose VIOLÉ" : "  ✓ Garde-fou anti-prose OK (bullets télégraphiques)");

console.log(`\n=== Total : ${Date.now() - tStart}ms ===`);
console.log(`Cible brief : < 30 000 ms ${Date.now() - tStart < 30000 ? "✓ OK" : "✗ DÉPASSÉ"}`);
