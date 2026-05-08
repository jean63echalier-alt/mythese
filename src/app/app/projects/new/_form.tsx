"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const DISCIPLINES = [
  "Information & Communication",
  "Marketing",
  "Sciences sociales",
  "Sciences",
  "Droit",
  "Économie / Gestion",
  "Lettres / Humanités",
  "Autre",
];

export function NewProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState(DISCIPLINES[0]);
  const [level, setLevel] = useState("m2");
  const [problematique, setProblematique] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrMsg("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, discipline, level, problematique }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setState("err");
      setErrMsg(data.error || "Erreur");
      return;
    }
    const { id } = await res.json();
    router.push(`/app/projects/${id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="title">Titre du projet *</Label>
        <Input
          id="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Beeclou — solution publicitaire urbaine, mémoire M2 Info-Com"
          disabled={state === "loading"}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discipline">Discipline</Label>
          <Select
            id="discipline"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            disabled={state === "loading"}
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="level">Niveau</Label>
          <Select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={state === "loading"}
          >
            <option value="m1">Master 1</option>
            <option value="m2">Master 2</option>
            <option value="doctorat">Doctorat</option>
            <option value="autre">Autre</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="problematique">Problématique pressentie (optionnel)</Label>
        <Textarea
          id="problematique"
          rows={4}
          maxLength={1000}
          value={problematique}
          onChange={(e) => setProblematique(e.target.value)}
          placeholder="Ex: En quoi les nouvelles solutions publicitaires en milieu urbain interrogent-elles le rapport entre attention et espace public ?"
          disabled={state === "loading"}
        />
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          Pas grave si c'est encore flou — Mythese t'aidera à la reformuler dans le Module 2.
        </p>
      </div>
      {state === "err" && (
        <p className="text-sm text-red-700">{errMsg}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="lg" disabled={state === "loading"}>
          {state === "loading" ? "Création..." : "Créer le projet"}
        </Button>
      </div>
    </form>
  );
}
