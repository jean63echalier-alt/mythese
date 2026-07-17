"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FormatToolbar } from "./_format-toolbar";
import type { Annotation, EditProposal, Role, Section } from "./types";

const BLOCK_TAGS = new Set(["H1", "H2", "H3", "P"]);

export interface TextePanelHandle {
  /** Insère du HTML au dernier point du curseur connu dans l'éditeur (ou en fin de section si aucun). */
  insertHtml: (html: string) => void;
  /** Insère un bloc identifié par id, ou remplace le bloc existant portant ce même id. */
  appendOrReplaceBlock: (blockId: string, html: string) => void;
}

function resolveBloc(node: Node, editor: HTMLElement): { el: HTMLElement; index: number } | null {
  let cur: Node | null = node;
  while (cur && cur !== editor) {
    if (cur.parentNode === editor && cur instanceof HTMLElement) {
      const index = Array.from(editor.children).indexOf(cur);
      return index === -1 ? null : { el: cur, index };
    }
    cur = cur.parentNode;
  }
  return null;
}

interface TextePanelProps {
  section: Section;
  role: Role;
  activeAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDemanderIA: (texte: string, blocIndex: number, blocHtml: string) => void;
  onCommenterProf: (texte: string, commentaire: string) => void;
  onChangeStatut: (statut: Section["statut"]) => void;
  onContentChange: (html: string) => void;
  pendingEdit: EditProposal | null;
  editLoadingBlocIndex: number | null;
  onAcceptEdit: () => void;
  onRejectEdit: () => void;
}

export const TextePanel = forwardRef<TextePanelHandle, TextePanelProps>(function TextePanel({
  section,
  role,
  activeAnnotationId,
  onSelectAnnotation,
  onDemanderIA,
  onCommenterProf,
  onChangeStatut,
  onContentChange,
  pendingEdit,
  editLoadingBlocIndex,
  onAcceptEdit,
  onRejectEdit,
}, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const [floating, setFloating] = useState<{ x: number; y: number; texte: string; blocIndex: number; blocHtml: string } | null>(null);
  const [commentDraft, setCommentDraft] = useState<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [editRectTop, setEditRectTop] = useState<number | null>(null);

  function saveRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      lastRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  useImperativeHandle(ref, () => ({
    insertHtml(html: string) {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      const sel = window.getSelection();
      if (lastRangeRef.current && editor.contains(lastRangeRef.current.commonAncestorContainer)) {
        sel?.removeAllRanges();
        sel?.addRange(lastRangeRef.current);
      } else {
        const r = document.createRange();
        r.selectNodeContents(editor);
        r.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
      document.execCommand("insertHTML", false, html);
      saveRange();
      onContentChange(editor.innerHTML);
    },
    appendOrReplaceBlock(blockId: string, html: string) {
      const editor = editorRef.current;
      if (!editor) return;
      const existing = editor.querySelector(`#${blockId}`);
      if (existing) existing.outerHTML = html;
      else editor.insertAdjacentHTML("beforeend", html);
      onContentChange(editor.innerHTML);
    },
  }));

  useEffect(() => {
    setFloating(null);
    setCommentDraft(null);
  }, [section.id]);

  useEffect(() => {
    const idx = pendingEdit?.blocIndex ?? editLoadingBlocIndex;
    if (idx == null || !editorRef.current) {
      setEditRectTop(null);
      return;
    }
    const block = editorRef.current.children[idx] as HTMLElement | undefined;
    if (!block) {
      setEditRectTop(null);
      return;
    }
    const rect = block.getBoundingClientRect();
    const parentRect = editorRef.current.getBoundingClientRect();
    setEditRectTop(rect.top - parentRect.top + rect.height);
  }, [pendingEdit, editLoadingBlocIndex]);

  function handleAcceptEdit() {
    if (!pendingEdit || !editorRef.current) return;
    const block = editorRef.current.children[pendingEdit.blocIndex];
    if (block) {
      const temp = document.createElement("div");
      temp.innerHTML = pendingEdit.newHtml;
      const newEl = temp.firstElementChild;
      if (newEl) block.replaceWith(newEl);
    }
    onContentChange(editorRef.current.innerHTML);
    onAcceptEdit();
  }

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
    saveRange();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !editorRef.current) {
      setFloating(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setFloating(null);
      return;
    }
    const texte = sel.toString().trim();
    if (!texte) {
      setFloating(null);
      return;
    }
    const bloc = resolveBloc(range.commonAncestorContainer, editorRef.current);
    if (!bloc) {
      setFloating(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const parentRect = editorRef.current.getBoundingClientRect();
    setFloating({
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top,
      texte,
      blocIndex: bloc.index,
      blocHtml: bloc.el.outerHTML,
    });
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
                    onDemanderIA(floating.texte, floating.blocIndex, floating.blocHtml);
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

          {editLoadingBlocIndex != null && !pendingEdit && editRectTop != null && (
            <div
              className="absolute left-0 right-0 z-20 mt-1 text-xs text-[var(--color-ink-muted)] italic"
              style={{ top: editRectTop }}
            >
              ✨ L'IA retouche ce passage…
            </div>
          )}

          {pendingEdit && editRectTop != null && (
            <div
              className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] shadow-md p-3 space-y-2"
              style={{ top: editRectTop }}
            >
              <p className="text-xs text-[var(--color-ink-muted)]">{pendingEdit.resume}</p>
              <div
                className="prose-mythese text-sm line-through opacity-60"
                dangerouslySetInnerHTML={{ __html: pendingEdit.oldHtml }}
              />
              <div
                className="prose-mythese text-sm bg-green-50 rounded px-2 py-1"
                dangerouslySetInnerHTML={{ __html: pendingEdit.newHtml }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAcceptEdit}
                  className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-[var(--color-forest)] hover:bg-green-100 font-medium"
                >
                  ✓ Accepter
                </button>
                <button
                  type="button"
                  onClick={onRejectEdit}
                  className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-[var(--color-burgundy)] hover:bg-red-100 font-medium"
                >
                  ✗ Rejeter
                </button>
              </div>
            </div>
          )}
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
});

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
