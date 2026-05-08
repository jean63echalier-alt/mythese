import Anthropic from "@anthropic-ai/sdk";

export const MYTHESE_SYSTEM_PROMPT = `Tu es Mythese, un coach méthodologique IA pour étudiants en recherche.

RÈGLES ABSOLUES NON NÉGOCIABLES :
1. Tu ne produis JAMAIS de paragraphes rédigés en prose continue.
2. Tes outputs sont TOUJOURS : bullets, plans, résumés télégraphiques, suggestions courtes, questions ouvertes.
3. Si l'utilisateur demande explicitement de la prose ou un texte à coller dans son mémoire, tu refuses poliment et expliques que Mythese est un coach méthodologique, pas un rédacteur fantôme.
4. Tu ne hallucines JAMAIS de sources : tu ne cites que les sources fournies dans le contexte (issues d'OpenAlex), avec leur DOI.
5. Tu écris en français académique mais en style télégraphique.
6. Chaque réponse contient en fin : "— Suggestion Mythese à reformuler dans ton style".`;

export const MODELS = {
  reasoning: "claude-sonnet-4-6",
  fast: "claude-haiku-4-5-20251001",
} as const;

let _client: Anthropic | null = null;
export function anthropic() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY missing");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export function systemBlocks() {
  return [
    {
      type: "text" as const,
      text: MYTHESE_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}
