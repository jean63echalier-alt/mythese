import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { parseContentHtml, type Block } from "./_parse-html";
import type { Section } from "./types";

function blockToParagraph(block: Block): Paragraph {
  const runs = block.runs.map(
    (r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic, underline: r.underline ? {} : undefined }),
  );
  if (block.type === "heading") {
    const level = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 }[block.level];
    return new Paragraph({ heading: level, children: runs, spacing: { before: 240, after: 120 } });
  }
  if (block.type === "list-item") {
    return new Paragraph({
      children: runs,
      bullet: block.ordered ? undefined : { level: 0 },
      numbering: block.ordered ? { reference: "export-numbering", level: 0 } : undefined,
    });
  }
  return new Paragraph({ children: runs, spacing: { after: 160 } });
}

export async function exportToDocx(projectTitle: string, sections: Section[]) {
  const children: Paragraph[] = [
    new Paragraph({ text: projectTitle, heading: HeadingLevel.TITLE, spacing: { after: 320 } }),
  ];

  for (const section of sections) {
    children.push(new Paragraph({ text: section.nom, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 } }));
    const blocks = parseContentHtml(section.contenu);
    for (const block of blocks) children.push(blockToParagraph(block));
  }

  const doc = new Document({
    numbering: { config: [{ reference: "export-numbering", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] }] },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${slugify(projectTitle)}.docx`);
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "memoire";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
