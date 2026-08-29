"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicTech } from "../../lib/types";

interface StackSectionProps {
  tech: PublicTech[];
}

/**
 * 04 · TECH STACK — official-logotype cards fixed in a grid.
 * No float, no tilt. CSS-only hover (lift, shadow, border glow,
 * icon scale/rotate, title highlight). GSAP handles the entry
 * stagger only, with clearProps so hover transforms are never
 * blocked by inline transforms.
 */
export function StackSection({ tech }: StackSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = section.querySelectorAll<HTMLElement>("[data-tilt]");
      if (!cards.length) return;

      gsap.from(cards, {
        opacity: 0,
        y: 46,
        filter: "blur(6px)",
        stagger: 0.05,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: { trigger: ".stack-grid", start: "top 80%", toggleActions: "play none none reverse" }
      });

      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section stack" id="stack" ref={sectionRef} aria-label="Tech stack">
      <div className="container section-head">
        <div>
          <p className="kicker">
            <span className="kicker-num">04</span> Capabilities
          </p>
          <h2 className="masthead" data-reveal>
            Tech Stack
          </h2>
        </div>
        <p className="head-meta">
          {tech.length > 1 ? `${tech.length} tools` : tech.length === 1 ? "One tool" : "No tools"}
          <br />
          Fluent, not fancied
        </p>
      </div>

      <div className="container">
        <div className="stack-grid" id="stackGrid">
          {tech.map((t) => (
            <div className="tech-card" data-tilt key={t._id}>
              <span className="tech-glow" aria-hidden="true" />
              <div className="tech-logo">
                {t.logo ? <img src={t.logo} alt="" /> : <span className="tech-logo-fallback" aria-hidden="true" />}
              </div>
              <span className="tech-name">{t.name}</span>
              <span className="tech-cat">{t.cat}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
