import Link from "next/link";
import { NewProjectForm } from "./_form";

export const metadata = { title: "Nouveau projet — Mythese" };

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Link href="/app" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
        ← Mes projets
      </Link>
      <h1 className="font-serif text-3xl font-semibold mt-2 mb-2">Nouveau projet</h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-8">
        Décris ton mémoire, ta thèse ou ton dossier de recherche.
      </p>
      <NewProjectForm />
    </div>
  );
}
