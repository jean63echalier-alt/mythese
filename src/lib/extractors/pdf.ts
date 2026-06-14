import type { Extractor } from "./types";

export const pdfExtractor: Extractor = {
  type: "pdf",
  accepts: (mimeType) => mimeType === "application/pdf",
  extract: async ({ buffer }) => {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  },
};
