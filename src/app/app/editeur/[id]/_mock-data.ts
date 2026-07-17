import type { Section, ChatMessage, CreditUsage } from "./types";

export const SECTIONS_MOCK: Section[] = [
  {
    id: "etat-de-lart",
    nom: "État de l'art",
    ordre: 1,
    statut: "valide",
    contenu:
      "<p>La littérature récente sur l'apprentissage par renforcement distribué converge vers <b>trois familles d'approches</b>. Kalashnikov et al. (2023) montrent que la parallélisation naïve degrade la convergeance dans 40% des cas étudiés. Cette observation rejoint les travaux de Chen (2022) sur la stabilité des gradients.</p><ul><li>Approches synchrones</li><li>Approches asynchrones</li><li>Approches hybrides</li></ul>",
    annotations: [
      {
        id: "a1",
        auteur: "prof",
        texteAncre: { start: 0, end: 0 },
        texte: "convergeance dans 40% des cas",
        commentaire: "Orthographe : « convergence ». Vérifie aussi la source primaire, la stat me semble datée.",
        resolu: false,
      },
      {
        id: "a2",
        auteur: "ia",
        texteAncre: { start: 0, end: 0 },
        texte: "trois familles d'approches",
        commentaire: "Suggestion : cite explicitement les 3 familles ici pour guider le lecteur avant le détail.",
        resolu: false,
      },
    ],
  },
  {
    id: "problematique",
    nom: "Problématique",
    ordre: 2,
    statut: "valide",
    contenu:
      "<p>Dans quelle mesure la parallélisation asynchrone des agents affecte-t-elle la qualité de convergeance dans les environnements à récompense éparse ?</p>",
    annotations: [],
  },
  {
    id: "methodologie",
    nom: "Méthodologie",
    ordre: 3,
    statut: "en_cours",
    contenu:
      "<p>Le protocole expérimental repose sur une comparaison contrôlée entre trois configurations d'agents. Chaque configuration est évaluée sur 5 seeds aléatoires afin d'assurer la robustesse statistique des résultats obtenus.</p>",
    annotations: [
      {
        id: "a3",
        auteur: "faute",
        texteAncre: { start: 0, end: 0 },
        texte: "afin d'assurer",
        commentaire: "Faute de frappe probable.",
        suggestion: "afin d'assurer",
        resolu: false,
      },
    ],
  },
  { id: "analyse-resultats", nom: "Analyse / Résultats", ordre: 4, statut: "non_commence", contenu: "", annotations: [] },
  { id: "discussion", nom: "Discussion", ordre: 5, statut: "non_commence", contenu: "", annotations: [] },
  { id: "conclusion", nom: "Conclusion", ordre: 6, statut: "a_revoir", contenu: "<p>Section à retravailler suite aux retours du comité.</p>", annotations: [] },
];

export const CHAT_IA_MOCK: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    contenu: "Comment structurer ma section méthodologie pour un protocole comparatif ?",
    timestamp: "10:12",
  },
  {
    id: "m2",
    role: "assistant",
    contenu:
      "Pour un protocole comparatif, structure en 4 temps : (1) hypothèses testées, (2) configurations comparées avec justification, (3) variables contrôlées, (4) critères de mesure. Veux-tu que je rédige un paragraphe d'ouverture ?",
    timestamp: "10:12",
  },
];

export const CHAT_PROF_MOCK: ChatMessage[] = [
  {
    id: "p1",
    role: "user",
    contenu: "Bonjour, j'ai laissé un commentaire sur l'état de l'art concernant la source de la stat 40%.",
    timestamp: "hier 18:40",
  },
];

export const CREDIT_MOCK: CreditUsage = {
  utilise: 82,
  quota: 100,
  forfait: "Forfait Étudiant — 200 messages/mois",
};
