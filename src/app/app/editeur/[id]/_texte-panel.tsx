"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Annotation, Role, Section } from "./types";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Annotations n'ont pas d'offset fiable côté mock : on repère la 1re occurrence du texte ancré.
// Recalculé uniquement au montage / changement de section, jamais pendant la frappe
// (sinon le contentEditable perd le curseur à chaque re-render React).
function renderHighlighted(content: string, annotations: Annotation[]) {
  type Mark = { start: number; end: number; ann: Annotation };
  const marks: Mark[] = [];
  for (const ann of annotations) {
    const idx = content.indexOf(ann.texte);
    if (idx === -1) continue;
    marks.push({ start: idx, end: idx + ann.texte.length, ann });
  }
  marks.sort((a, b) => a.start - b.start);

  let html = "";
  let cursor = 0;
  for (const m of marks) {
    if (m.start < cursor) continue;
    html += escapeHtml(content.slice(cursor, m.start));
    const cls =
      m.ann.auteur === "faute"
        ? "faute-souligne"
        : m.ann.auteur === "prof"
          ? "annotation-prof"
          : "annotation-ia";
    html += `<mark class="${cls}" data-annotation-id="${m.ann.id}">${escapeHtml(content.slice(m.start, m.end))}</mark>`;
    cursor = m.end;
  }
  html += escapeHtml(content.slice(cursor));
  return html || "<span class=\"text-[var(--color-ink-muted)] italic\">Section vide — commence à rédiger.</span>";
}

export function TextePanel({
  section,
  role,
  activeAnnotationId,
  onSelectAnnotation,
  onDemanderIA,
  onCommenterProf,
  onChangeStatut,
  insertSignal,
}: {
  section: Section;
  role: Role;
  activeAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDemanderIA: (texte: string) => void;
  onCommenterProf: (texte: string, commentaire: string) => void;
  onChangeStatut: (statut: Section["statut"]) => void;
  insertSignal: { texte: string; nonce: number } | null;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState<{ x: number; y: number; texte: string } | null>(null);
  const [commentDraft, setCommentDraft] = useState<string | null>(null);

  const html = useMemo(() => renderHighlighted(section.contenu, section.annotations), [section.id]);

  useEffect(() => {
    setFloating(null);
    setCommentDraft(null);
  }, [section.id]);

  useEffect(() => {
    if (!insertSignal || !editorRef.current) return;
    const p = document.createElement("p");
    p.textContent = insertSignal.texte;
    p.className = "mt-2";
    editorRef.current.appendChild(p);
  }, [insertSignal]);

  function handleSelectionUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setFloating(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      setFloating(null);
      return;
    }
    const texte = sel.toString().trim();
    if (!texte) {
      setFloating(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const parentRect = editorRef.current.getBoundingClientRect();
    setFloating({ x: rect.left - parentRect.left + rect.width / 2, y: rect.top - parentRect.top, texte });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8 relative">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h1 className="font-serif text-2xl font-semibold">{section.nom}</h1>
          {role === "professeur" ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onChangeStatut("valide")}
                className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-[var(--color-forest)] hover:bg-green-100 font-medium"
              >
                ✓ Valider
              </button>
              <button
                type="button"
                onClick={() => onChangeStatut("a_revoir")}
                className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-[var(--color-burgundy)] hover:bg-red-100 font-medium"
              >
                ✗ À revoir
              </button>
            </div>
          ) : (
            <StatutBadge statut={section.statut} />
          )}
        </div>

        <div className="relative">
          {floating && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-full flex gap-1"
              style={{ left: floating.x, top: floating.y - 8 }}
            >
              {role === "professeur" ? (
                <button
                  type="button"
                  onClick={() => {
                    setCommentDraft(floating.texte);
                    setFloating(null);
                  }}
                  className="rounded-md bg-[var(--color-ink)] text-white text-xs px-2.5 py-1.5 shadow-md hover:bg-black"
                >
                  💬 Commenter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onDemanderIA(floating.texte);
                    setFloating(null);
                    window.getSelection()?.removeAllRanges();
                  }}
                  className="rounded-md bg-[var(--color-burgundy)] text-white text-xs px-2.5 py-1.5 shadow-md hover:bg-[var(--color-burgundy-soft)]"
                >
                  ✨ Demander à l'IA
                </button>
              )}
            </div>
          )}

          {commentDraft !== null && (
            <div className="absolute z-20 top-0 left-0 right-0 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-md shadow-md p-3">
              <p className="text-xs text-[var(--color-ink-muted)] mb-1">
                Commentaire sur : « {commentDraft.slice(0, 60)}{commentDraft.length > 60 ? "…" : ""} »
              </p>
              <textarea
                autoFocus
                rows={2}
                className="w-full text-sm border border-[var(--color-line)] rounded p-2 outline-none focus:border-[var(--color-burgundy)]"
                placeholder="Ton commentaire…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const val = (e.target as HTMLTextAreaElement).value.trim();
                    if (val) onCommenterProf(commentDraft, val);
                    setCommentDraft(null);
                  }
                  if (e.key === "Escape") setCommentDraft(null);
                }}
              />
            </div>
          )}

          <div
            key={section.id}
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onMouseUp={handleSelectionUp}
            onKeyUp={handleSelectionUp}
            onClick={(e) => {
              const target = (e.target as HTMLElement).closest("[data-annotation-id]");
              if (target) onSelectAnnotation(target.getAttribute("data-annotation-id")!);
            }}
            className="prose-mythese min-h-[50vh] text-[15px] leading-relaxed outline-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {section.annotations.length > 0 && (
          <div className="mt-8 space-y-2 border-t border-[var(--color-line)] pt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
              Annotations
            </h3>
            {section.annotations.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAnnotation(a.id)}
                className={cn(
                  "block w-full text-left rounded-md border p-2.5 text-sm transition-colors",
                  activeAnnotationId === a.id
                    ? "border-[var(--color-burgundy)] bg-[var(--color-cream)]"
                    : "border-[var(--color-line)] hover:bg-[var(--color-line-soft)]",
                )}
              >
                <span className={cn("text-xs font-medium", authorColor(a.auteur))}>
                  {authorLabel(a.auteur)}
                </span>
                <p className="text-[var(--color-ink-soft)] mt-0.5">{a.commentaire}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function authorLabel(a: Annotation["auteur"]) {
  return a === "prof" ? "Professeur" : a === "ia" ? "Suggestion IA" : "Faute détectée";
}
function authorColor(a: Annotation["auteur"]) {
  return a === "prof" ? "text-[var(--color-forest)]" : a === "ia" ? "text-[var(--color-burgundy)]" : "text-amber-600";
}

function StatutBadge({ statut }: { statut: Section["statut"] }) {
  const map: Record<Section["statut"], { label: string; cls: string }> = {
    non_commence: { label: "Non commencé", cls: "bg-[var(--color-line-soft)] text-[var(--color-ink-muted)]" },
    en_cours: { label: "En cours", cls: "bg-blue-50 text-blue-700" },
    valide: { label: "Validé", cls: "bg-green-50 text-[var(--color-forest)]" },
    a_revoir: { label: "À revoir", cls: "bg-red-50 text-[var(--color-burgundy)]" },
  };
  const s = map[statut];
  return <span className={cn("text-xs px-2 py-1 rounded-full font-medium shrink-0", s.cls)}>{s.label}</span>;
}
