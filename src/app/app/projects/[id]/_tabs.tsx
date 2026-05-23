"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/app/projects/${projectId}`;
  const tabs = [
    { href: base, label: "Vue d'ensemble" },
    { href: `${base}/etat-de-lart`, label: "État de l'art" },
    { href: `${base}/problematique`, label: "Problématique" },
    { href: `${base}/relecture-methodo`, label: "Relecture" },
    { href: `${base}/equipe`, label: "Équipe" },
  ];

  return (
    <div className="border-b border-[var(--color-line)] flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
              active
                ? "border-[var(--color-burgundy)] text-[var(--color-burgundy)] font-medium"
                : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
