"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function InviteForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("director");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrMsg("");
    const res = await fetch(`/api/projects/${projectId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setState("err");
      setErrMsg(data.error || "Erreur");
      return;
    }
    setState("ok");
    setEmail("");
    router.refresh();
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-3"
    >
      <div className="grid md:grid-cols-[1fr_180px_auto] gap-3 items-end">
        <div>
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prof@univ.fr"
            disabled={state === "loading"}
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Rôle</Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={state === "loading"}
          >
            <option value="director">Directeur</option>
            <option value="author">Auteur (co-rédacteur)</option>
            <option value="reader">Lecteur</option>
          </Select>
        </div>
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Envoi..." : "Inviter"}
        </Button>
      </div>
      {state === "ok" && (
        <p className="text-xs text-green-700">✓ Invitation envoyée.</p>
      )}
      {state === "err" && (
        <p className="text-xs text-red-700">{errMsg}</p>
      )}
    </form>
  );
}
