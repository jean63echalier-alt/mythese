import type { Extractor } from "./types";

export const docxExtractor: Extractor = {
  type: "docx",
  accepts: (mimeType) =>
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  extract: async ({ buffer }) => {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  },
};
