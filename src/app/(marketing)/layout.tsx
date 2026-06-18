import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0A0901] text-[#E1D9D1]">
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
              background:linear-gradient(#C89B5A, transparent);
              animation: scrollDrop 2s ease-in-out infinite;
            }
          `,
        }}
      />

      {/* Fond ambiant fixe : vignette + grain */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(200,155,90,0.07), transparent 60%), radial-gradient(ellipse at center, transparent 45%, rgba(5,5,2,0.6) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[#C89B5A] focus:px-3 focus:py-2 focus:text-[#0A0901]"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-30 border-b border-[#241f14] bg-[#0A0901]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="font-serif text-xl font-medium uppercase tracking-[0.22em] text-[#E1D9D1]"
          >
            Mythèse
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/#solution"
              className="text-[#9a9285] transition-colors hover:text-[#E1D9D1]"
            >
              Le produit
            </Link>
            <Link
              href="/#comment"
              className="text-[#9a9285] transition-colors hover:text-[#E1D9D1]"
            >
              Comment ça marche
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[#C89B5A]/50 px-4 py-2 text-[#C89B5A] transition-colors hover:bg-[#C89B5A] hover:text-[#0A0901]"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="relative z-10 flex-1">
        {children}
      </main>

      <footer className="relative z-10 mt-20 border-t border-[#241f14] bg-[#0A0901]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm text-[#9a9285] md:grid-cols-3">
          <div>
            <div className="mb-2 font-serif text-xl uppercase tracking-[0.18em] text-[#C89B5A]">
              Mythèse
            </div>
            <p className="text-xs text-[#7a7263]">
              Le coach IA qui structure ton mémoire de recherche.
              <br />
              Sources peer-reviewed. Méthodo française. Jamais à ta place.
            </p>
          </div>
          <div>
            <div className="mb-2 font-medium text-[#E1D9D1]">Produit</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/#solution" className="hover:text-[#C89B5A]">
                  Modules
                </Link>
              </li>
              <li>
                <Link href="/#comment" className="hover:text-[#C89B5A]">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/experience.html" className="hover:text-[#C89B5A]">
                  L&apos;expérience immersive
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#C89B5A]">
                  Se connecter
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-medium text-[#E1D9D1]">Légal</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/legal/mentions" className="hover:text-[#C89B5A]">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/legal/cgu" className="hover:text-[#C89B5A]">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/legal/contact" className="hover:text-[#C89B5A]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#241f14] py-4 text-center text-xs text-[#7a7263]">
          © 2026 Mythese — Mention nécessaire avant lancement payant
        </div>
      </footer>
    </div>
  );
}
