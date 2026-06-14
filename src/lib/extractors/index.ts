import "server-only";
import type { ContenuType, ExtractInput } from "./types";
import { textExtractor } from "./text";
import { pdfExtractor } from "./pdf";
import { docxExtractor } from "./docx";

// V2 (à brancher ici sans réécriture) : imageExtractor (OCR), audioExtractor (Whisper)
const EXTRACTORS = [textExtractor, pdfExtractor, docxExtractor];

export function extractorFor(mimeType: string) {
  return EXTRACTORS.find((e) => e.accepts(mimeType)) ?? null;
}

export async function extractText(input: ExtractInput): Promise<{ text: string; type: ContenuType }> {
  const extractor = extractorFor(input.mimeType);
  if (!extractor) {
    throw new Error(`Type de fichier non supporté : ${input.mimeType}`);
  }
  const text = await extractor.extract(input);
  return { text, type: extractor.type };
}

export type { ContenuType, ExtractInput, Extractor } from "./types";
