"use client";

import { useEffect, useState } from "react";

/**
 * Hero immersif de la page d'accueil.
 * Reprend le style de /experience.html et permet d'entrer dans l'expérience
 * de DEUX façons : par clic sur le bouton, ou par scroll vers le bas depuis le haut.
 * Un flag de session évite de re-déclencher l'entrée quand l'utilisateur
 * revient sur le site à la sortie du tunnel.
 */
export function ExperienceHero() {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let entered = false;
    const seen = () => sessionStorage.getItem("mt_exp_seen") === "1";

    const enter = () => {
      if (entered || seen()) return;
      entered = true;
      sessionStorage.setItem("mt_exp_seen", "1");
      setLeaving(true);
      setTimeout(() => {
        window.location.href = "/experience.html";
      }, 500);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY <= 2 && e.deltaY > 6) enter();
    };

    let ty: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      ty = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (ty == null) return;
      const dy = ty - (e.touches[0]?.clientY ?? ty);
      if (window.scrollY <= 2 && dy > 28) enter();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const explore = () => {
    sessionStorage.setItem("mt_exp_seen", "1");
    document.getElementById("decouvrir")?.scrollIntoView({ behavior: "smooth" });
  };

  const markSeen = () => sessionStorage.setItem("mt_exp_seen", "1");

  return (
    <section
      className={`relative flex min-h-[100svh] flex-col items-center justify-center px-5 text-center transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <p
        className="hero-rise mb-7 text-xs uppercase tracking-[0.4em] text-[var(--color-burgundy)]"
        style={{ animationDelay: "0.1s" }}
      >
        Une expérience immersive
      </p>

      <h1 className="font-serif leading-[0.95] text-[var(--color-ink)]">
        <span
          className="hero-rise block text-3xl italic text-[var(--color-burgundy)] md:text-5xl"
          style={{ animationDelay: "0.25s" }}
        >
          Ton mémoire,
        </span>
        <span
          className="hero-rise block text-6xl uppercase tracking-wide md:text-8xl"
          style={{ animationDelay: "0.4s" }}
        >
          en pleine lumière
        </span>
      </h1>

      <p
        className="hero-rise mt-8 max-w-xl text-base leading-relaxed text-[var(--color-ink-soft)] md:text-lg"
        style={{ animationDelay: "0.6s" }}
      >
        Deux intelligences artificielles dialoguent sous tes yeux. Tu vois chaque
        échange, tu valides chaque orientation — et tu restes l&apos;unique auteur.
      </p>

      <div
        className="hero-rise mt-11 flex flex-col items-center gap-5"
        style={{ animationDelay: "0.8s" }}
      >
        <a
          href="/experience.html"
          onClick={markSeen}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-burgundy)] px-9 py-4 text-sm uppercase tracking-[0.2em] text-[var(--color-burgundy)] transition-colors duration-300 hover:bg-[var(--color-burgundy)] hover:text-white"
        >
          ✦ Vivre l&apos;expérience
        </a>
        <button
          onClick={explore}
          className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-burgundy)]"
        >
          ou explorer le site ↓
        </button>
      </div>

      <div
        className="hero-rise absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[var(--color-ink-muted)]"
        style={{ animationDelay: "1.1s" }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">
          Défiler pour entrer dans l&apos;expérience
        </span>
        <span className="scroll-line" />
      </div>
    </section>
  );
}
