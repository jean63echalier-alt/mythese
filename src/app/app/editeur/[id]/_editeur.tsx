"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Toolbar } from "./_toolbar";
import { PlanPanel } from "./_plan-panel";
import { TextePanel, type TextePanelHandle } from "./_texte-panel";
import { ChatPanel } from "./_chat-panel";
import { SECTIONS_MOCK, CHAT_PROF_MOCK, CREDIT_MOCK, SOURCES_MOCK } from "./_mock-data";
import { exportToDocx } from "./_export-docx";
import { exportToPdf } from "./_export-pdf";
import { parseBibtex, escapeHtml } from "./_bibtex";
import type { ChatMessage, EditProposal, Role, Section, Source } from "./types";

export function Editeur({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [role, setRole] = useState<Role>("etudiant");
  const [sections, setSections] = useState<Section[]>(SECTIONS_MOCK);
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [chatIa, setChatIa] = useState<ChatMessage[]>([]);
  const [chatDirecteur, setChatDirecteur] = useState<ChatMessage[]>([]);
  const [chatProf, setChatProf] = useState<ChatMessage[]>(CHAT_PROF_MOCK);
  const [credit, setCredit] = useState(CREDIT_MOCK);
  const [prefillChat, setPrefillChat] = useState("");
  const [editContext, setEditContext] = useState<{ blocIndex: number; blocHtml: string; selectionTexte: string } | null>(null);
  const [pendingEdit, setPendingEdit] = useState<EditProposal | null>(null);
  const [editLoadingBlocIndex, setEditLoadingBlocIndex] = useState<number | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<"plan" | "texte" | "chat">("texte");
  const [sources, setSources] = useState<Source[]>(SOURCES_MOCK);
  const [focusSourcesSignal, setFocusSourcesSignal] = useState(0);
  const textePanelRef = useRef<TextePanelHandle>(null);

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

  function handleDemanderIA(texte: string, blocIndex: number, blocHtml: string) {
    setPrefillChat(`Concernant « ${texte} » : `);
    setEditContext({ blocIndex, blocHtml, selectionTexte: texte });
    setChatCollapsed(false);
    setMobileTab("chat");
  }

  async function handleSendIa(texte: string) {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", contenu: texte, timestamp: now };
    setChatIa((prev) => [...prev, userMsg]);
    setPrefillChat("");

    const context = editContext;
    setEditContext(null);

    if (!context) {
      try {
        const res = await fetch("/api/editeur/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: texte,
            history: chatIa.map((m) => ({ role: m.role, contenu: m.contenu })),
            sectionNom: activeSection.nom,
            sectionContenu: activeSection.contenu,
          }),
        });
        if (!res.ok) throw new Error(`chat ${res.status}`);
        const data: { reponse: string } = await res.json();
        setChatIa((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", contenu: data.reponse, timestamp: now },
        ]);
        setCredit((c) => ({ ...c, utilise: Math.min(c.quota, c.utilise + 6) }));
      } catch (e) {
        console.error("editeur chat", e);
        setChatIa((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", contenu: "Réponse indisponible — réessaie.", timestamp: now },
        ]);
      }
      return;
    }

    setEditLoadingBlocIndex(context.blocIndex);
    try {
      const res = await fetch("/api/editeur/edit-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocHtml: context.blocHtml,
          selectionTexte: context.selectionTexte,
          instruction: texte,
          sectionNom: activeSection.nom,
        }),
      });
      if (!res.ok) throw new Error(`edit-suggestion ${res.status}`);
      const data: { html: string; resume: string } = await res.json();
      const proposal: EditProposal = {
        id: crypto.randomUUID(),
        blocIndex: context.blocIndex,
        oldHtml: context.blocHtml,
        newHtml: data.html,
        resume: data.resume,
        statut: "pending",
      };
      setPendingEdit(proposal);
      setChatIa((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", contenu: data.resume, timestamp: now, edit: proposal },
      ]);
      setCredit((c) => ({ ...c, utilise: Math.min(c.quota, c.utilise + 6) }));
    } catch (e) {
      console.error("edit-suggestion", e);
      setChatIa((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", contenu: "Suggestion indisponible — réessaie.", timestamp: now },
      ]);
    } finally {
      setEditLoadingBlocIndex(null);
    }
  }

  async function handleSendDirecteur(texte: string) {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setChatDirecteur((prev) => [...prev, { id: crypto.randomUUID(), role: "user", contenu: texte, timestamp: now }]);

    try {
      const res = await fetch("/api/editeur/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texte,
          persona: "directeur",
          history: chatDirecteur.map((m) => ({ role: m.role, contenu: m.contenu })),
          sectionNom: activeSection.nom,
          sectionContenu: activeSection.contenu,
        }),
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const data: { reponse: string } = await res.json();
      setChatDirecteur((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", contenu: data.reponse, timestamp: now },
      ]);
      setCredit((c) => ({ ...c, utilise: Math.min(c.quota, c.utilise + 6) }));
    } catch (e) {
      console.error("editeur chat directeur", e);
      setChatDirecteur((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", contenu: "Réponse indisponible — réessaie.", timestamp: now },
      ]);
    }
  }

  function handleSendProf(texte: string) {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setChatProf((prev) => [...prev, { id: crypto.randomUUID(), role: "user", contenu: texte, timestamp: now }]);
  }

  function handleAddSource(source: Omit<Source, "id" | "cited">) {
    setSources((prev) => [...prev, { ...source, id: crypto.randomUUID(), cited: false }]);
  }

  function handleDeleteSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  function handleInsertCitation(source: Source) {
    const authorLast = source.auteur.split(",")[0].trim();
    const html = `<span class="cite">(${escapeHtml(authorLast)}, ${escapeHtml(source.annee)})</span>&nbsp;`;
    textePanelRef.current?.insertHtml(html);
    setSources((prev) => prev.map((s) => (s.id === source.id ? { ...s, cited: true } : s)));
  }

  function handleGenerateBiblio() {
    const cited = sources.filter((s) => s.cited).slice().sort((a, b) => a.auteur.localeCompare(b.auteur));
    if (cited.length === 0) return;
    const entries = cited
      .map((s) => `${escapeHtml(s.auteur)} (${escapeHtml(s.annee)}). ${escapeHtml(s.titre)}${s.editeur ? ". " + escapeHtml(s.editeur) : ""}.`)
      .join("<br>");
    textePanelRef.current?.appendOrReplaceBlock(
      "bibliographie-section",
      `<section id="bibliographie-section"><h2>Bibliographie</h2><p>${entries}</p></section>`,
    );
  }

  function handleImportBibtex(text: string): number {
    const parsed = parseBibtex(text);
    if (parsed.length > 0) {
      setSources((prev) => [...prev, ...parsed.map((p) => ({ ...p, id: crypto.randomUUID(), cited: false }))]);
    }
    return parsed.length;
  }

  function handleOpenSources() {
    setChatCollapsed(false);
    setMobileTab("chat");
    setFocusSourcesSignal((v) => v + 1);
  }

  function handleAcceptEdit() {
    if (!pendingEdit) return;
    setChatIa((prev) =>
      prev.map((m) => (m.edit?.id === pendingEdit.id ? { ...m, edit: { ...pendingEdit, statut: "accepted" } } : m)),
    );
    setPendingEdit(null);
  }

  function handleRejectEdit() {
    if (!pendingEdit) return;
    setChatIa((prev) =>
      prev.map((m) => (m.edit?.id === pendingEdit.id ? { ...m, edit: { ...pendingEdit, statut: "rejected" } } : m)),
    );
    setPendingEdit(null);
  }

  function handleExport(format: "docx" | "pdf") {
    if (format === "docx") exportToDocx(projectTitle, sections);
    else exportToPdf(projectTitle, sections);
  }

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <Toolbar projectTitle={projectTitle} role={role} onRoleChange={setRole} onExport={handleExport} onOpenSources={handleOpenSources} />

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
            ref={textePanelRef}
            section={activeSection}
            role={role}
            activeAnnotationId={activeAnnotationId}
            onSelectAnnotation={setActiveAnnotationId}
            onDemanderIA={handleDemanderIA}
            onCommenterProf={handleCommenterProf}
            onChangeStatut={(statut) => updateSection(activeSectionId, { statut })}
            onContentChange={(html) => updateSection(activeSectionId, { contenu: html })}
            pendingEdit={pendingEdit}
            editLoadingBlocIndex={editLoadingBlocIndex}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
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
            chatDirecteur={chatDirecteur}
            chatProf={chatProf}
            credit={credit}
            prefill={prefillChat}
            onSendIa={handleSendIa}
            onSendDirecteur={handleSendDirecteur}
            onSendProf={handleSendProf}
            collapsed={chatCollapsed}
            onToggleCollapsed={() => setChatCollapsed((v) => !v)}
            sources={sources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onInsertSource={handleInsertCitation}
            onGenerateBiblio={handleGenerateBiblio}
            onImportBibtex={handleImportBibtex}
            focusSourcesSignal={focusSourcesSignal}
          />
        </div>
      </div>
    </div>
  );
}
