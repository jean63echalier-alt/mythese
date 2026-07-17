"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FormatToolbar } from "./_format-toolbar";
import type { Annotation, Role, Section } from "./types";

const BLOCK_TAGS = new Set(["H1", "H2", "H3", "P"]);

export function TextePanel({
  section,
  role,
  activeAnnotationId,
  onSelectAnnotation,
  onDemanderIA,
  onCommenterProf,
  onChangeStatut,
  onContentChange,
  insertSignal,
}: {
  section: Section;
  role: Role;
  activeAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDemanderIA: (texte: string) => void;
  onCommenterProf: (texte: string, commentaire: string) => void;
  onChangeStatut: (statut: Section["statut"]) => void;
  onContentChange: (html: string) => void;
  insertSignal: { texte: string; nonce: number } | null;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState<{ x: number; y: number; texte: string } | null>(null);
  const [commentDraft, setCommentDraft] = useState<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFloating(null);
    setCommentDraft(null);
  }, [section.id]);

  useEffect(() => {
    if (!insertSignal || !editorRef.current) return;
    const p = document.createElement("p");
    p.textContent = insertSignal.texte;
    editorRef.current.appendChild(p);
    onContentChange(editorRef.current.innerHTML);
  }, [insertSignal]);

  function refreshActiveFormats() {
    const formats = new Set<string>();
    for (const cmd of ["bold", "italic", "underline"]) {
      if (document.queryCommandState(cmd)) formats.add(cmd);
    }
    const block = document.queryCommandValue("formatBlock").toUpperCase();
    formats.add(BLOCK_TAGS.has(block) ? block : "P");
    setActiveFormats(formats);
  }

  function handleCommand(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    refreshActiveFormats();
    if (editorRef.current) onContentChange(editorRef.current.innerHTML);
  }

  function handleSelectionUp() {
    refreshActiveFormats();
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

        <FormatToolbar activeFormats={activeFormats} onCommand={handleCommand} />

        <div className="relative">
          {floating && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-full flex gap-1"
              style={{ left: floating.x, top: floating.y - 8 }}
            >
              {role === "professeur" ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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
                  onMouseDown={(e) => e.preventDefault()}
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
            spellCheck
            suppressContentEditableWarning
            onMouseUp={handleSelectionUp}
            onKeyUp={handleSelectionUp}
            onBlur={() => editorRef.current && onContentChange(editorRef.current.innerHTML)}
            className="prose-mythese min-h-[50vh] text-[15px] leading-relaxed outline-none"
            dangerouslySetInnerHTML={{ __html: section.contenu || "<p><br></p>" }}
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
                <p className="text-[var(--color-ink-soft)] mt-0.5">« {a.texte} » — {a.commentaire}</p>
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
