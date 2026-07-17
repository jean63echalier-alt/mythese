"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Source, SourceType } from "./types";

const TYPES: SourceType[] = ["Article", "Ouvrage", "Site web", "Thèse"];

export function SourcesPanel({
  sources,
  onAdd,
  onDelete,
  onInsert,
  onGenerateBiblio,
  onImportBibtex,
}: {
  sources: Source[];
  onAdd: (source: Omit<Source, "id" | "cited">) => void;
  onDelete: (id: string) => void;
  onInsert: (source: Source) => void;
  onGenerateBiblio: () => void;
  onImportBibtex: (text: string) => number;
}) {
  const [auteur, setAuteur] = useState("");
  const [titre, setTitre] = useState("");
  const [annee, setAnnee] = useState("");
  const [type, setType] = useState<SourceType>("Article");
  const [editeur, setEditeur] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const citedCount = sources.filter((s) => s.cited).length;

  function handleAdd() {
    if (!auteur.trim() || !annee.trim() || !titre.trim()) return;
    onAdd({ auteur: auteur.trim(), annee: annee.trim(), titre: titre.trim(), editeur: editeur.trim(), type });
    setAuteur("");
    setTitre("");
    setAnnee("");
    setEditeur("");
  }

  function handleImport() {
    if (!importText.trim()) return;
    const count = onImportBibtex(importText);
    setImportMsg(count > 0 ? `${count} source${count > 1 ? "s" : ""} importée${count > 1 ? "s" : ""}.` : "Aucune source reconnue dans ce fichier.");
    if (count > 0) setImportText("");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const count = onImportBibtex(text);
      setImportMsg(count > 0 ? `${count} source${count > 1 ? "s" : ""} importée${count > 1 ? "s" : ""} depuis ${file.name}.` : "Aucune source reconnue dans ce fichier.");
    });
    e.target.value = "";
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-3 border-b border-[var(--color-line)] space-y-1.5">
        <input
          value={auteur}
          onChange={(e) => setAuteur(e.target.value)}
          placeholder="Auteur (ex : Dupont, J.)"
          className="w-full text-xs border border-[var(--color-line)] rounded-md px-2.5 py-1.5 outline-none focus:border-[var(--color-burgundy)]"
        />
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre"
          className="w-full text-xs border border-[var(--color-line)] rounded-md px-2.5 py-1.5 outline-none focus:border-[var(--color-burgundy)]"
        />
        <div className="flex gap-1.5">
          <input
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            placeholder="Année"
            className="flex-1 min-w-0 text-xs border border-[var(--color-line)] rounded-md px-2.5 py-1.5 outline-none focus:border-[var(--color-burgundy)]"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SourceType)}
            className="flex-1 min-w-0 text-xs border border-[var(--color-line)] rounded-md px-2 py-1.5 bg-[var(--color-paper)]"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <input
          value={editeur}
          onChange={(e) => setEditeur(e.target.value)}
          placeholder="Revue / éditeur (optionnel)"
          className="w-full text-xs border border-[var(--color-line)] rounded-md px-2.5 py-1.5 outline-none focus:border-[var(--color-burgundy)]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="w-full text-xs font-medium rounded-md bg-[var(--color-burgundy)] text-white py-1.5 hover:opacity-90"
        >
          + Ajouter une source
        </button>

        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className="w-full text-xs font-medium rounded-md border border-[var(--color-line)] text-[var(--color-ink-soft)] py-1.5 hover:bg-[var(--color-line-soft)]"
        >
          {importOpen ? "▾" : "▸"} Importer BibTeX / Zotero
        </button>
        {importOpen && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] text-[var(--color-ink-muted)]">
              Colle un export BibTeX (Zotero : clic droit sur la collection → Exporter → BibTeX), ou choisis un fichier .bib.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              placeholder="@article{ ... }"
              className="w-full text-[11px] font-mono border border-[var(--color-line)] rounded-md px-2 py-1.5 outline-none focus:border-[var(--color-burgundy)]"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleImport}
                className="flex-1 text-xs font-medium rounded-md bg-[var(--color-ink)] text-white py-1.5 hover:opacity-90"
              >
                Importer le texte
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 text-xs font-medium rounded-md border border-[var(--color-line)] py-1.5 hover:bg-[var(--color-line-soft)]"
              >
                Choisir un fichier
              </button>
              <input ref={fileRef} type="file" accept=".bib,text/plain" className="hidden" onChange={handleFile} />
            </div>
            {importMsg && <p className="text-[10px] text-[var(--color-ink-soft)]">{importMsg}</p>}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sources.length === 0 && (
          <p className="text-xs text-[var(--color-ink-muted)]">Aucune source pour l'instant.</p>
        )}
        {sources.map((s) => (
          <div
            key={s.id}
            className={cn(
              "rounded-md border p-2.5 text-xs leading-relaxed",
              s.cited ? "border-[var(--color-burgundy)] bg-[var(--color-cream)]" : "border-[var(--color-line)]",
            )}
          >
            <p className="mb-1.5">
              <strong>{s.auteur}</strong> ({s.annee}) — {s.titre}
              <span className="ml-1.5 inline-block text-[9px] uppercase tracking-wide text-[var(--color-ink-muted)] bg-[var(--color-line-soft)] rounded px-1.5 py-0.5">
                {s.type}
              </span>
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onInsert(s)}
                className="text-[11px] border border-[var(--color-burgundy)] text-[var(--color-burgundy)] rounded px-2 py-0.5 hover:bg-[var(--color-cream)]"
              >
                {s.cited ? "✓ Citée" : "Insérer"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                title="Supprimer"
                className="text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-burgundy)] px-1.5"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--color-line)]">
        <button
          type="button"
          onClick={onGenerateBiblio}
          disabled={citedCount === 0}
          className="w-full text-xs font-medium rounded-md bg-[var(--color-ink)] text-white py-2 disabled:opacity-40"
        >
          Insérer / mettre à jour la bibliographie
        </button>
      </div>
    </div>
  );
}
