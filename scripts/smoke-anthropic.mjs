// Smoke test: Anthropic call with system prompt + JSON output
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYS = `Tu es Mythese, un coach méthodologique IA pour étudiants en recherche.

RÈGLES ABSOLUES NON NÉGOCIABLES :
1. Tu ne produis JAMAIS de paragraphes rédigés en prose continue.
2. Tes outputs sont TOUJOURS : bullets, plans, résumés télégraphiques, suggestions courtes, questions ouvertes.
3. Si l'utilisateur demande explicitement de la prose ou un texte à coller dans son mémoire, tu refuses poliment et expliques que Mythese est un coach méthodologique, pas un rédacteur fantôme.
4. Tu ne hallucines JAMAIS de sources : tu ne cites que les sources fournies dans le contexte (issues d'OpenAlex), avec leur DOI.
5. Tu écris en français académique mais en style télégraphique.
6. Chaque réponse contient en fin : "— Suggestion Mythese à reformuler dans ton style".`;

console.log("Test 1 — reformulation Haiku");
const t1 = Date.now();
const r1 = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 200,
  system: [{ type: "text", text: "Tu reformules des mots-clés en query OpenAlex courte. Max 6 mots anglais, sans guillemets, sans booléens. Réponds avec la query brute uniquement." }],
  messages: [
    { role: "user", content: "Sujet: solutions publicitaires urbaines\nMots-clés: DOOH, attention, espace public, ville" },
  ],
});
console.log(`  Time: ${Date.now() - t1}ms`);
console.log("  Output:", r1.content[0].type === "text" ? r1.content[0].text : "(non-text)");
console.log("  Tokens:", r1.usage);

console.log("\nTest 2 — résumés Sonnet (problématique 8 questions)");
const t2 = Date.now();
const r2 = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2500,
  system: [{ type: "text", text: SYS, cache_control: { type: "ephemeral" } }],
  messages: [
    {
      role: "user",
      content: `Réponses étudiant aux 8 questions :
1. Phénomène: solutions publicitaires en milieu urbain qui privatisent l'attention
2. Pourquoi maintenant: saturation pub urbaine, écrans LED partout
3. Pour qui: usagers de la ville, urbanistes, marques
4. Angle unique: l'attention comme commun urbain
5. Hypothèses: privatisation / saturation / négociation
6. Discipline: Information & Communication
7. Concepts: attention, espace public, dispositif
8. Angle: défendre l'attention comme bien commun

Produis 3 problématiques distinctes (A, B, C) avec plan binaire ou ternaire. Strict JSON :
{ "proposals": [ { "letter": "A", "problematique": "...", "planType": "binaire|ternaire", "parts": [ { "title": "...", "bullets": ["..."] } ] } ] }
PAS de markdown, PAS de prose, JSON uniquement.`,
    },
  ],
});
console.log(`  Time: ${Date.now() - t2}ms`);
console.log("  Tokens:", r2.usage);
const text = r2.content.filter((b) => b.type === "text").map((b) => b.text).join("");
console.log("  Output (first 300 chars):", text.slice(0, 300));
try {
  let parsed;
  try { parsed = JSON.parse(text); } catch {
    const m = text.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : null;
  }
  console.log("  ✓ Parsed JSON. Proposals count:", parsed?.proposals?.length);
  if (parsed?.proposals?.[0]) {
    const p = parsed.proposals[0];
    console.log(`  Proposal A: "${p.problematique?.slice(0, 100)}..."`);
    console.log(`  Plan type: ${p.planType}, parts: ${p.parts?.length}`);
  }
} catch (e) {
  console.error("  ✗ JSON parse failed:", e.message);
}

console.log("\nDone.");
