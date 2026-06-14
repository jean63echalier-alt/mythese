import type { Extractor } from "./types";

export const textExtractor: Extractor = {
  type: "texte",
  accepts: (mimeType) => mimeType.startsWith("text/"),
  extract: async ({ buffer }) => buffer.toString("utf-8"),
};
