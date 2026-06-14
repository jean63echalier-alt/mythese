// Extracteurs de contenu — interface commune (fichier -> texte brut)
// V1 : texte, pdf, docx. V2 (à brancher sans réécriture) : image (OCR), audio (Whisper).

export type ContenuType = "texte" | "pdf" | "docx" | "image" | "audio";

export interface ExtractInput {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
}

export interface Extractor {
  type: ContenuType;
  accepts: (mimeType: string) => boolean;
  extract: (input: ExtractInput) => Promise<string>;
}
