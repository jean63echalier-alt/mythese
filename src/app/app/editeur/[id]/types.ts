export type StatutSection = "non_commence" | "en_cours" | "valide" | "a_revoir";

export interface Section {
  id: string;
  nom: string;
  ordre: number;
  statut: StatutSection;
  contenu: string;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  auteur: "prof" | "ia" | "faute";
  texteAncre: { start: number; end: number };
  texte: string;
  commentaire: string;
  suggestion?: string;
  resolu: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  contenu: string;
  timestamp: string;
  edit?: EditProposal;
}

export interface EditProposal {
  id: string;
  blocIndex: number;
  oldHtml: string;
  newHtml: string;
  resume: string;
  statut: "pending" | "accepted" | "rejected";
}

export interface CreditUsage {
  utilise: number;
  quota: number;
  forfait: string;
}

export type Role = "etudiant" | "professeur";

export type SourceType = "Article" | "Ouvrage" | "Site web" | "Thèse";

export interface Source {
  id: string;
  auteur: string;
  annee: string;
  titre: string;
  editeur?: string;
  type: SourceType;
  cited: boolean;
}
