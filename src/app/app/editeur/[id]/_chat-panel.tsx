"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SourcesPanel } from "./_sources-panel";
import type { ChatMessage, CreditUsage, Role, Source } from "./types";

type Tab = "ia" | "directeur" | "prof" | "sources";

export function ChatPanel({
  role,
  chatIa,
  chatDirecteur,
  chatProf,
  credit,
  prefill,
  onSendIa,
  onSendDirecteur,
  onSendProf,
  collapsed,
  onToggleCollapsed,
  sources,
  onAddSource,
  onDeleteSource,
  onInsertSource,
  onGenerateBiblio,
  onImportBibtex,
  focusSourcesSignal,
}: {
  role: Role;
  chatIa: ChatMessage[];
  chatDirecteur: ChatMessage[];
  chatProf: ChatMessage[];
  credit: CreditUsage;
  prefill: string;
  onSendIa: (texte: string) => void;
  onSendDirecteur: (texte: string) => void;
  onSendProf: (texte: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  sources: Source[];
  onAddSource: (source: Omit<Source, "id" | "cited">) => void;
  onDeleteSource: (id: string) => void;
  onInsertSource: (source: Source) => void;
  onGenerateBiblio: () => void;
  onImportBibtex: (text: string) => number;
  focusSourcesSignal: number;
}) {
  const [tab, setTab] = useState<Tab>("ia");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pct = Math.round((credit.utilise / credit.quota) * 100);
  const critique = pct >= 100;
  const alerte = pct >= 80;
  const isIaPersona = tab === "ia" || tab === "directeur";

  useEffect(() => {
    if (prefill) {
      setDraft(prefill);
      setTab("ia");
    }
  }, [prefill]);

  useEffect(() => {
    if (focusSourcesSignal > 0) setTab("sources");
  }, [focusSourcesSignal]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatIa.length, chatDirecteur.length, chatProf.length, tab]);

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Ouvrir le panneau"
          className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] text-lg"
        >
          ☰
        </button>
      </div>
    );
  }

  function handleSend() {
    const val = draft.trim();
    if (!val) return;
    if (tab === "ia" || tab === "directeur") {
      if (critique) return;
      (tab === "ia" ? onSendIa : onSendDirecteur)(val);
    } else if (tab === "prof") {
      onSendProf(val);
    }
    setDraft("");
  }

  const messages = tab === "ia" ? chatIa : tab === "directeur" ? chatDirecteur : tab === "prof" ? chatProf : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-line)]">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] shrink-0"
          title="Réduire le panneau"
        >
          ☰
        </button>
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as Tab)}
          className="flex-1 min-w-0 text-xs font-medium border border-[var(--color-line)] rounded-md px-2 py-1.5 bg-[var(--color-paper)]"
        >
          <option value="ia">💬 Chat IA</option>
          <option value="directeur">🎓 Directeur de recherche</option>
          <option value="prof">👥 Chat Prof ↔ Élève</option>
          <option value="sources">📚 Sources</option>
        </select>
      </div>

      {tab === "sources" ? (
        <SourcesPanel
          sources={sources}
          onAdd={onAddSource}
          onDelete={onDeleteSource}
          onInsert={onInsertSource}
          onGenerateBiblio={onGenerateBiblio}
          onImportBibtex={onImportBibtex}
        />
      ) : (
        <>
          {isIaPersona && (
            <div className="px-3 pt-2">
              <span className="inline-block text-[10px] font-medium tracking-wide uppercase bg-[var(--color-cream)] border border-[var(--color-line)] text-[var(--color-ink-soft)] rounded-full px-2 py-0.5">
                IA par Anthropic
              </span>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {tab === "prof" && (
              <p className="text-xs text-[var(--color-ink-muted)] italic border-b border-[var(--color-line-soft)] pb-2">
                Canal humain — l'IA n'intervient jamais ici.
              </p>
            )}
            {tab === "directeur" && messages.length === 0 && (
              <p className="text-xs text-[var(--color-ink-muted)] italic border-b border-[var(--color-line-soft)] pb-2">
                Cadrage académique exigeant — questions socratiques, jamais de rédaction à ta place.
              </p>
            )}
            {messages.length === 0 && (
              <p className="text-sm text-[var(--color-ink-muted)]">Aucun message pour l'instant.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn("max-w-[90%]", m.role === "user" ? "ml-auto" : "")}>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-[var(--color-burgundy)] text-white"
                      : "bg-[var(--color-cream)] text-[var(--color-ink)] border border-[var(--color-line)]",
                  )}
                >
                  {m.contenu}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--color-ink-muted)]">{m.timestamp}</span>
                  {tab === "ia" && m.edit && (
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        m.edit.statut === "accepted"
                          ? "text-[var(--color-forest)]"
                          : m.edit.statut === "rejected"
                            ? "text-[var(--color-ink-muted)]"
                            : "text-[var(--color-burgundy)]",
                      )}
                    >
                      {m.edit.statut === "accepted"
                        ? "✓ Modification appliquée"
                        : m.edit.statut === "rejected"
                          ? "✗ Modification rejetée"
                          : "⏳ Voir la proposition dans le document"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isIaPersona && (
            <div className="px-3 py-2 border-t border-[var(--color-line)]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--color-ink-soft)]">{credit.forfait}</span>
                <span className={cn("font-medium", critique ? "text-[var(--color-burgundy)]" : "text-[var(--color-ink-soft)]")}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-line-soft)] overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", critique ? "bg-[var(--color-burgundy)]" : alerte ? "bg-[var(--color-warn)]" : "bg-[var(--color-forest)]")}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {alerte && (
                <button
                  type="button"
                  className="mt-1.5 text-xs text-[var(--color-burgundy)] hover:underline font-medium"
                >
                  Recharger des crédits
                </button>
              )}
            </div>
          )}

          <div className="p-3 border-t border-[var(--color-line)] flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isIaPersona && critique}
              placeholder={isIaPersona && critique ? "Quota atteint — recharge tes crédits" : "Entrer un message / une consigne"}
              className="flex-1 text-sm border border-[var(--color-line)] rounded-md px-3 py-2 outline-none focus:border-[var(--color-burgundy)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isIaPersona && critique}
              className="rounded-md bg-[var(--color-burgundy)] text-white text-sm px-3 disabled:opacity-40"
            >
              ↑
            </button>
          </div>
        </>
      )}
    </div>
  );
}
