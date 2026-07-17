"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage, CreditUsage, Role } from "./types";

type Tab = "ia" | "prof";

export function ChatPanel({
  role,
  chatIa,
  chatProf,
  credit,
  prefill,
  onSendIa,
  onSendProf,
  onInsert,
  collapsed,
  onToggleCollapsed,
}: {
  role: Role;
  chatIa: ChatMessage[];
  chatProf: ChatMessage[];
  credit: CreditUsage;
  prefill: string;
  onSendIa: (texte: string) => void;
  onSendProf: (texte: string) => void;
  onInsert: (texte: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [tab, setTab] = useState<Tab>("ia");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pct = Math.round((credit.utilise / credit.quota) * 100);
  const critique = pct >= 100;
  const alerte = pct >= 80;

  useEffect(() => {
    if (prefill) setDraft(prefill);
  }, [prefill]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatIa.length, chatProf.length, tab]);

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Ouvrir le chat"
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
    if (tab === "ia") {
      if (critique) return;
      onSendIa(val);
    } else {
      onSendProf(val);
    }
    setDraft("");
  }

  const messages = tab === "ia" ? chatIa : chatProf;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-line)]">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          title="Réduire le chat"
        >
          ☰
        </button>
        <div className="flex gap-1">
          <TabButton active={tab === "ia"} onClick={() => setTab("ia")} label="Chat IA" />
          <TabButton active={tab === "prof"} onClick={() => setTab("prof")} label="Chat Prof ↔ Élève" />
        </div>
      </div>

      {tab === "ia" && (
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
              {tab === "ia" && m.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => onInsert(m.contenu)}
                  className="text-[10px] text-[var(--color-burgundy)] hover:underline"
                >
                  Insérer dans le document
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tab === "ia" && (
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
          disabled={tab === "ia" && critique}
          placeholder={tab === "ia" && critique ? "Quota atteint — recharge tes crédits" : "Entrer un message / une consigne"}
          className="flex-1 text-sm border border-[var(--color-line)] rounded-md px-3 py-2 outline-none focus:border-[var(--color-burgundy)] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={tab === "ia" && critique}
          className="rounded-md bg-[var(--color-burgundy)] text-white text-sm px-3 disabled:opacity-40"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-xs px-2.5 py-1.5 rounded-md transition-colors",
        active ? "bg-[var(--color-cream)] text-[var(--color-ink)] font-medium" : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]",
      )}
    >
      {label}
    </button>
  );
}
