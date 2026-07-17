"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Toolbar } from "./_toolbar";
import { PlanPanel } from "./_plan-panel";
import { TextePanel } from "./_texte-panel";
import { ChatPanel } from "./_chat-panel";
import { SECTIONS_MOCK, CHAT_IA_MOCK, CHAT_PROF_MOCK, CREDIT_MOCK } from "./_mock-data";
import type { ChatMessage, Role, Section } from "./types";

const REPONSES_IA_MOCK = [
  "Bonne piste. Pense à justifier chaque choix méthodologique par une référence — ça renforce la crédibilité de la section.",
  "Je peux reformuler ce passage pour plus de clarté, ou l'étoffer avec un exemple concret. Que préfères-tu ?",
  "Attention à la cohérence des temps verbaux dans ce paragraphe — tu passes du présent au passé sans transition.",
];

export function Editeur({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [role, setRole] = useState<Role>("etudiant");
  const [sections, setSections] = useState<Section[]>(SECTIONS_MOCK);
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [chatIa, setChatIa] = useState<ChatMessage[]>(CHAT_IA_MOCK);
  const [chatProf, setChatProf] = useState<ChatMessage[]>(CHAT_PROF_MOCK);
  const [credit, setCredit] = useState(CREDIT_MOCK);
  const [prefillChat, setPrefillChat] = useState("");
  const [insertSignal, setInsertSignal] = useState<{ texte: string; nonce: number } | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<"plan" | "texte" | "chat">("texte");

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];

  const [leftW, setLeftW] = useState(220);
  const [rightW, setRightW] = useState(340);
  const dragRef = useRef<"left" | "right" | null>(null);

  function startDrag(side: "left" | "right") {
    dragRef.current = side;
    function onMove(e: MouseEvent) {
      if (dragRef.current === "left") setLeftW((w) => Math.min(360, Math.max(160, w + e.movementX)));
      if (dragRef.current === "right") setRightW((w) => Math.min(480, Math.max(260, w - e.movementX)));
    }
    function onUp() {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function updateSection(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleCommenterProf(texte: string, commentaire: string) {
    updateSection(activeSectionId, {
      annotations: [
        ...activeSection.annotations,
        { id: crypto.randomUUID(), auteur: "prof", texteAncre: { start: 0, end: 0 }, texte, commentaire, resolu: false },
      ],
    });
  }

  function handleDemanderIA(texte: string) {
    setPrefillChat(`Concernant « ${texte} » : `);
    setChatCollapsed(false);
    setMobileTab("chat");
  }

  function handleSendIa(texte: string) {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", contenu: texte, timestamp: now };
    setChatIa((prev) => [...prev, userMsg]);
    setPrefillChat("");
    setCredit((c) => ({ ...c, utilise: Math.min(c.quota, c.utilise + 6) }));
    setTimeout(() => {
      const reply = REPONSES_IA_MOCK[Math.floor(Math.random() * REPONSES_IA_MOCK.length)];
      setChatIa((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", contenu: reply, timestamp: now },
      ]);
    }, 700);
  }

  function handleSendProf(texte: string) {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setChatProf((prev) => [...prev, { id: crypto.randomUUID(), role: "user", contenu: texte, timestamp: now }]);
  }

  function handleInsert(texte: string) {
    setInsertSignal({ texte, nonce: Date.now() });
    updateSection(activeSectionId, { contenu: `${activeSection.contenu}\n\n${texte}` });
  }

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <Toolbar projectTitle={projectTitle} role={role} onRoleChange={setRole} />

      <div className="md:hidden flex border-b border-[var(--color-line)] text-sm">
        {(["plan", "texte", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={cn(
              "flex-1 py-2 capitalize border-b-2",
              mobileTab === t ? "border-[var(--color-burgundy)] text-[var(--color-burgundy)] font-medium" : "border-transparent text-[var(--color-ink-soft)]",
            )}
          >
            {t === "chat" ? "Chat" : t}
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-h-0">
        <div
          style={{ width: leftW }}
          className={cn("border-r border-[var(--color-line)] shrink-0", mobileTab === "plan" ? "block w-full md:w-auto" : "hidden md:block")}
        >
          <PlanPanel sections={sections} activeId={activeSectionId} onSelect={setActiveSectionId} />
        </div>
        <div
          onMouseDown={() => startDrag("left")}
          className="hidden md:block w-1 cursor-col-resize hover:bg-[var(--color-burgundy)] transition-colors shrink-0"
        />

        <div className={cn("flex-1 min-w-0", mobileTab === "texte" ? "block" : "hidden md:block")}>
          <TextePanel
            section={activeSection}
            role={role}
            activeAnnotationId={activeAnnotationId}
            onSelectAnnotation={setActiveAnnotationId}
            onDemanderIA={handleDemanderIA}
            onCommenterProf={handleCommenterProf}
            onChangeStatut={(statut) => updateSection(activeSectionId, { statut })}
            insertSignal={insertSignal}
          />
        </div>

        <div
          onMouseDown={() => startDrag("right")}
          className="hidden md:block w-1 cursor-col-resize hover:bg-[var(--color-burgundy)] transition-colors shrink-0"
        />
        <div
          style={{ width: chatCollapsed ? 44 : rightW }}
          className={cn("border-l border-[var(--color-line)] shrink-0", mobileTab === "chat" ? "block w-full md:w-auto" : "hidden md:block")}
        >
          <ChatPanel
            role={role}
            chatIa={chatIa}
            chatProf={chatProf}
            credit={credit}
            prefill={prefillChat}
            onSendIa={handleSendIa}
            onSendProf={handleSendProf}
            onInsert={handleInsert}
            collapsed={chatCollapsed}
            onToggleCollapsed={() => setChatCollapsed((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}
