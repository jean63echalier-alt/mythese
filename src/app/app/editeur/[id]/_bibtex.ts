import type { Source, SourceType } from "./types";

/** Échappe une valeur avant insertion dans du HTML brut (citation/bibliographie) — les sources peuvent venir d'un import BibTeX externe non fiable. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TYPE_MAP: Record<string, SourceType> = {
  article: "Article",
  book: "Ouvrage",
  inbook: "Ouvrage",
  incollection: "Ouvrage",
  booklet: "Ouvrage",
  phdthesis: "Thèse",
  mastersthesis: "Thèse",
  misc: "Site web",
  online: "Site web",
  webpage: "Site web",
  electronic: "Site web",
};

function stripBraces(value: string): string {
  return value.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
}

function formatFirstAuthor(authorField: string): string {
  const first = authorField.split(/\s+and\s+/i)[0]?.trim() ?? "";
  if (!first) return "";
  if (first.includes(",")) {
    const [last, given] = first.split(",").map((p) => p.trim());
    const initial = given?.[0] ? `${given[0]}.` : "";
    return initial ? `${last}, ${initial}` : last;
  }
  const parts = first.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initial = parts[0][0] ? `${parts[0][0]}.` : "";
  return initial ? `${last}, ${initial}` : last;
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const re = /(\w+)\s*=\s*(\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)")/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const key = m[1].toLowerCase();
    const value = stripBraces(m[3] ?? m[4] ?? "");
    fields[key] = value;
  }
  return fields;
}

/** Parse un texte BibTeX (export Zotero/Mendeley/EndNote) en sources — pas une grammaire BibTeX complète, couvre les exports usuels. */
export function parseBibtex(text: string): Array<Omit<Source, "id" | "cited">> {
  const entries: Array<Omit<Source, "id" | "cited">> = [];
  const entryRe = /@(\w+)\s*\{\s*[^,]*,/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(text))) {
    const type = m[1].toLowerCase();
    const braceStart = text.indexOf("{", m.index);
    let depth = 0;
    let end = -1;
    for (let i = braceStart; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) continue;
    const body = text.slice(braceStart + 1, end);
    entryRe.lastIndex = end + 1;

    const fields = parseFields(body);
    if (!fields.title) continue;
    entries.push({
      auteur: formatFirstAuthor(fields.author ?? "") || "Auteur inconnu",
      annee: fields.year ?? "",
      titre: fields.title,
      editeur: fields.journal || fields.publisher || fields.booktitle || "",
      type: TYPE_MAP[type] ?? "Article",
    });
  }
  return entries;
}
