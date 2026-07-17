export type Run = { text: string; bold: boolean; italic: boolean; underline: boolean };
export type Block =
  | { type: "heading"; level: 1 | 2 | 3; runs: Run[] }
  | { type: "paragraph"; runs: Run[] }
  | { type: "list-item"; ordered: boolean; runs: Run[] };

const HEADING_LEVEL: Record<string, 1 | 2 | 3> = { H1: 1, H2: 2, H3: 3 };

function collectRuns(node: Node, style: { bold: boolean; italic: boolean; underline: boolean }): Run[] {
  const runs: Run[] = [];
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? "";
      if (text) runs.push({ text, ...style });
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName;
      const next = {
        bold: style.bold || tag === "B" || tag === "STRONG",
        italic: style.italic || tag === "I" || tag === "EM",
        underline: style.underline || tag === "U",
      };
      if (tag === "BR") {
        runs.push({ text: "\n", ...style });
      } else {
        runs.push(...collectRuns(el, next));
      }
    }
  }
  return runs;
}

// Convertit le HTML produit par le contentEditable (formatBlock/execCommand) en blocs
// {heading|paragraph|list-item} portables — source commune pour l'export DOCX et PDF.
export function parseContentHtml(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html || "<p></p>", "text/html");
  const blocks: Block[] = [];

  function walk(root: Element) {
    for (const el of Array.from(root.children)) {
      const tag = el.tagName;
      if (tag in HEADING_LEVEL) {
        blocks.push({ type: "heading", level: HEADING_LEVEL[tag], runs: collectRuns(el, { bold: false, italic: false, underline: false }) });
      } else if (tag === "UL" || tag === "OL") {
        for (const li of Array.from(el.children)) {
          if (li.tagName !== "LI") continue;
          blocks.push({ type: "list-item", ordered: tag === "OL", runs: collectRuns(li, { bold: false, italic: false, underline: false }) });
        }
      } else if (tag === "P" || tag === "DIV" || tag === "BLOCKQUOTE") {
        const runs = collectRuns(el, { bold: false, italic: false, underline: false });
        if (runs.length) blocks.push({ type: "paragraph", runs });
      } else {
        walk(el);
      }
    }
  }

  walk(doc.body);
  if (blocks.length === 0) {
    const text = doc.body.textContent?.trim();
    if (text) blocks.push({ type: "paragraph", runs: [{ text, bold: false, italic: false, underline: false }] });
  }
  return blocks;
}
