import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Styles d'ambiance + animations (style experience.html) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes heroRise {
              from { opacity: 0; transform: translateY(26px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .hero-rise { opacity: 0; animation: heroRise .9s cubic-bezier(.16,1,.3,1) forwards; }
            @keyframes scrollDrop {
              0%   { transform: scaleY(0); transform-origin: top; }
              45%  { transform: scaleY(1); transform-origin: top; }
              55%  { transform: scaleY(1); transform-origin: bottom; }
              100% { transform: scaleY(0); transform-origin: bottom; }
            }
            .scroll-line {
              display:block; width:1px; height:42px;
              background:linear-gradient(var(--color-burgundy), transparent);
              animation: scrollDrop 2s ease-in-out infinite;
            }
          `,
        }}
      />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[var(--color-burgundy)] focus:px-3 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="font-serif text-xl font-medium uppercase tracking-[0.22em] text-[var(--color-burgundy)]"
          >
            Mythèse
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/#solution"
              className="text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              Le produit
            </Link>
            <Link
              href="/#comment"
              className="text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              Comment ça marche
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--color-burgundy)]/50 px-4 py-2 text-[var(--color-burgundy)] transition-colors hover:bg-[var(--color-burgundy)] hover:text-white"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="relative z-10 flex-1">
        {children}
      </main>

      <footer className="relative z-10 mt-20 border-t border-[var(--color-line)] bg-[var(--color-bg)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm text-[var(--color-ink-muted)] md:grid-cols-3">
          <div>
            <div className="mb-2 font-serif text-xl uppercase tracking-[0.18em] text-[var(--color-burgundy)]">
              Mythèse
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Le coach IA qui structure ton mémoire de recherche.
              <br />
              Sources peer-reviewed. Méthodo française. Jamais à ta place.
            </p>
          </div>
          <div>
            <div className="mb-2 font-medium text-[var(--color-ink)]">Produit</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/#solution" className="hover:text-[var(--color-burgundy)]">
                  Modules
                </Link>
              </li>
              <li>
                <Link href="/#comment" className="hover:text-[var(--color-burgundy)]">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/experience.html" className="hover:text-[var(--color-burgundy)]">
                  L&apos;expérience immersive
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--color-burgundy)]">
                  Se connecter
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-medium text-[var(--color-ink)]">Légal</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/legal/mentions" className="hover:text-[var(--color-burgundy)]">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/legal/cgu" className="hover:text-[var(--color-burgundy)]">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/legal/contact" className="hover:text-[var(--color-burgundy)]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--color-line)] py-4 text-center text-xs text-[var(--color-ink-muted)]">
          © 2026 Mythese — Mention nécessaire avant lancement payant
        </div>
      </footer>
    </div>
  );
}
