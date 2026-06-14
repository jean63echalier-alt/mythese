// Plan de recherche — constantes partagées (étapes, statuts, prompts IA)

export type PlanStatut = "a_demarrer" | "en_cours" | "a_approfondir" | "valide";

export const ETAPES: { id: number; titre: string; description: string }[] = [
  { id: 1, titre: "Sujet & problématique", description: "Définir le sujet, le périmètre et la question de recherche." },
  { id: 2, titre: "Revue de littérature", description: "Identifier et synthétiser les travaux existants sur le sujet." },
  { id: 3, titre: "Méthodologie", description: "Choisir et justifier l'approche méthodologique de la recherche." },
  { id: 4, titre: "Collecte de données / terrain", description: "Mener les entretiens, enquêtes ou observations prévues." },
  { id: 5, titre: "Analyse & résultats", description: "Analyser les données collectées et formuler les résultats." },
  { id: 6, titre: "Rédaction finale & soutenance", description: "Rédiger le mémoire final et préparer la soutenance." },
];

export const STATUT_LABELS: Record<PlanStatut, string> = {
  a_demarrer: "À démarrer",
  en_cours: "En cours",
  a_approfondir: "À approfondir",
  valide: "Validé",
};

export const STATUT_STYLES: Record<PlanStatut, string> = {
  a_demarrer: "bg-[var(--color-line-soft)] text-[var(--color-ink-soft)]",
  en_cours: "bg-[var(--color-burgundy-soft)]/20 text-[var(--color-burgundy-soft)]",
  a_approfondir: "bg-[var(--color-burgundy)] text-white",
  valide: "bg-[var(--color-ink)] text-white",
};

const LABEL_TO_STATUT: Record<string, PlanStatut> = {
  "à démarrer": "a_demarrer",
  "a démarrer": "a_demarrer",
  "en cours": "en_cours",
  "à approfondir": "a_approfondir",
  "a approfondir": "a_approfondir",
  "validé": "valide",
  "valide": "valide",
};

export function statutFromLabel(label: unknown): PlanStatut {
  const key = String(label ?? "").trim().toLowerCase();
  return LABEL_TO_STATUT[key] ?? "a_demarrer";
}

export const CLASSIFIER_SYSTEM_PROMPT = `Tu es un assistant qui aide à structurer le plan de recherche d'un mémoire français (Master).

Voici les étapes du plan :

1. Sujet & problématique
2. Revue de littérature
3. Méthodologie
4. Collecte de données / terrain
5. Analyse & résultats
6. Rédaction finale & soutenance

Détermine :
- À quelle(s) étape(s) le contenu soumis correspond (par numéro, peut être plusieurs)
- Le niveau d'avancement de chaque étape concernée : "À démarrer", "En cours", "À approfondir" ou "Validé"
- Une justification courte (1 phrase) par étape

Réponds uniquement en JSON, format strict :
{ "etapes": [ { "id": 1, "statut": "...", "justification": "..." } ] }

PAS de markdown, PAS de texte hors JSON.`;

export function claudeAdvicePrompt(nomEtape: string, texteSoumis: string, question: string) {
  return `Tu es un assistant de méthodologie pour mémoires de recherche français (niveau Master).

L'étudiant travaille actuellement sur l'étape : "${nomEtape}".

Il soumet le contenu suivant et la question :

Contenu : """${texteSoumis}"""

Question : "${question}"

Analyse la structure, la rigueur argumentative et la méthodologie de ce contenu par rapport à cette étape précise.

Donne 2 à 3 recommandations concrètes et actionnables pour faire avancer cette étape.

Ne rédige jamais à la place de l'étudiant : guide-le.

Réponds en français, ton bienveillant mais exigeant, 150 mots maximum.`;
}

export function gptAdvicePrompt(nomEtape: string, texteSoumis: string, question: string) {
  return `Tu es un assistant spécialisé en recherche académique francophone.

L'étudiant travaille actuellement sur l'étape : "${nomEtape}".

Il soumet le contenu suivant et la question :

Contenu : """${texteSoumis}"""

Question : "${question}"

Analyse la pertinence du contenu par rapport à cette étape, suggère des pistes de sources ou de références complémentaires (sans inventer de sources précises), et identifie d'éventuelles lacunes argumentatives.

Réponds en français, 150 mots maximum.`;
}

export function synthesePrompt(nomEtape: string, avisClaude: string, avisGpt: string) {
  return `Tu reçois deux avis d'experts (Avis A et Avis B) donnés sur le même contenu et la même question d'un étudiant, concernant l'étape "${nomEtape}" de son mémoire.

Avis A : """${avisClaude}"""

Avis B : """${avisGpt}"""

Synthétise-les en une recommandation unique, claire et actionnable (100 mots maximum), en conservant ce qui est complémentaire et en résolvant les éventuelles contradictions.

Termine par une question ouverte qui invite l'étudiant à approfondir sa réflexion lui-même.`;
}
