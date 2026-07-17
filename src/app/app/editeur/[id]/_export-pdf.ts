import { jsPDF } from "jspdf";
import { parseContentHtml, type Block, type Run } from "./_parse-html";
import type { Section } from "./types";

const MARGIN = 20;
const PAGE_W = 210;
const PAGE_H = 297;
const MAX_W = PAGE_W - MARGIN * 2;

export async function exportToPdf(projectTitle: string, sections: Section[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  function ensureSpace(lineHeight: number) {
    if (y + lineHeight > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function fontFor(run: Run) {
    const style = run.bold && run.italic ? "bolditalic" : run.bold ? "bold" : run.italic ? "italic" : "normal";
    doc.setFont("helvetica", style);
  }

  // Retourne à la ligne manuellement run par run (jsPDF ne wrap pas le style mixte nativement).
  function drawRuns(runs: Run[], size: number, lineHeight: number, indent = 0) {
    doc.setFontSize(size);
    let x = MARGIN + indent;
    ensureSpace(lineHeight);
    for (const run of runs) {
      fontFor(run);
      const words = run.text.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        const w = doc.getTextWidth(word);
        if (x + w > MARGIN + MAX_W - indent) {
          y += lineHeight;
          ensureSpace(lineHeight);
          x = MARGIN + indent;
          if (/^\s+$/.test(word)) continue;
        }
        doc.text(word, x, y);
        x += w;
      }
    }
    y += lineHeight;
  }

  function drawBlock(block: Block) {
    if (block.type === "heading") {
      const size = { 1: 18, 2: 15, 3: 13 }[block.level];
      y += 4;
      drawRuns(block.runs.map((r) => ({ ...r, bold: true })), size, size * 0.5);
      y += 2;
    } else if (block.type === "list-item") {
      drawRuns([{ text: "•  ", bold: false, italic: false, underline: false }, ...block.runs], 11, 6, 4);
    } else {
      drawRuns(block.runs, 11, 6);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(projectTitle, MARGIN, y);
  y += 14;

  for (const section of sections) {
    drawBlock({ type: "heading", level: 1, runs: [{ text: section.nom, bold: true, italic: false, underline: false }] });
    for (const block of parseContentHtml(section.contenu)) drawBlock(block);
  }

  doc.save(`${slugify(projectTitle)}.pdf`);
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "memoire";
}
