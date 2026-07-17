"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Role } from "./types";

const MENUS: Record<string, string[]> = {
  Fichier: ["Nouveau", "Ouvrir", "Exporter (PDF)", "Exporter (Docx)", "Historique des versions"],
  Insertion: ["Citation", "Image", "Tableau", "Note de bas de page"],
  Outils: ["Vérification orthographique", "Compteur de mots", "Style APA"],
  Aperçu: ["Aperçu complet", "Aperçu de la section"],
};

export function Toolbar({
  projectTitle,
  role,
  onRoleChange,
  onExport,
}: {
  projectTitle: string;
  role: Role;
  onRoleChange: (r: Role) => void;
  onExport: (format: "docx" | "pdf") => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  function handleItemClick(item: string) {
    setOpen(null);
    if (item === "Exporter (PDF)") onExport("pdf");
    if (item === "Exporter (Docx)") onExport("docx");
  }

  return (
    <div className="relative border-b border-[var(--color-line)] bg-[var(--color-paper)] px-3">
      {open && (
        <button
          aria-label="Fermer le menu"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(null)}
        />
      )}
      <div className="flex items-center justify-between h-11 overflow-x-auto">
        <div className="flex items-center gap-1 text-sm shrink-0">
          {Object.keys(MENUS).map((label) => (
            <div key={label} className="relative">
              <button
                type="button"
                onClick={() => setOpen(open === label ? null : label)}
                className={cn(
                  "px-2.5 py-1.5 rounded transition-colors",
                  open === label ? "bg-[var(--color-cream)]" : "hover:bg-[var(--color-line-soft)]",
                )}
              >
                {label}
              </button>
              {open === label && (
                <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-md shadow-md py-1">
                  {MENUS[label].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="w-full text-left px-3 py-1.5 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)] hover:text-[var(--color-ink)]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            href="/app"
            className="px-2.5 py-1.5 rounded hover:bg-[var(--color-line-soft)]"
          >
            Mes projets
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0 pl-3">
          <span className="text-sm text-[var(--color-ink-muted)] hidden md:block truncate max-w-[240px]">
            {projectTitle}
          </span>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            title="Vue démo — bascule entre point de vue étudiant et professeur"
            className="text-xs border border-[var(--color-line)] rounded-md px-2 py-1 bg-[var(--color-cream)] text-[var(--color-ink-soft)]"
          >
            <option value="etudiant">Vue Étudiant</option>
            <option value="professeur">Vue Professeur</option>
          </select>
        </div>
      </div>
    </div>
  );
}
