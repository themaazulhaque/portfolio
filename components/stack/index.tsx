"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicTech } from "../../lib/types";

interface StackSectionProps {
  tech: PublicTech[];
}

const BRAND_COLORS: Record<string, string> = {
  react: "#61DAFB",
  "next.js": "#FFFFFF",
  nextjs: "#FFFFFF",
  javascript: "#F7DF1E",
  typescript: "#3178C6",
  "node.js": "#339933",
  nodejs: "#339933",
  mongodb: "#47A248",
  "express.js": "#FFFFFF",
  express: "#FFFFFF",
  python: "#3776AB",
  django: "#092E20",
  "react native": "#61DAFB",
  docker: "#2496ED",
  git: "#F05032",
  github: "#FFFFFF",
  "tailwind css": "#06B6D4",
  tailwind: "#06B6D4",
  supabase: "#3FCF8E",
  postgresql: "#4169E1",
  redis: "#DC382D",
  figma: "#F24E1E",
  adobe: "#FF0000",
  "vue.js": "#4FC08D",
  vuejs: "#4FC08D",
  angular: "#DD0031",
  svelte: "#FF3E00",
  webpack: "#8DD6F9",
  vite: "#646CFF",
  prisma: "#2D3748",
  firebase: "#FFCA28",
  aws: "#FF9900",
  "google cloud": "#4285F4",
  azure: "#0078D4",
  linux: "#FCC624",
  nginx: "#009639",
  graphql: "#E10098",
  rust: "#DEA584",
  go: "#00ADD8",
  java: "#ED8B00",
  "c++": "#00599C",
  ruby: "#CC342D",
  php: "#777BB4",
  swift: "#F05138",
  kotlin: "#7F52FF",
  terraform: "#7B42BC",
  kubernetes: "#326CE5",
};

function getBrandColor(name: string): string {
  const key = name.toLowerCase().trim();
  return BRAND_COLORS[key] || "rgba(255, 255, 255, 0.6)";
}

export function StackSection({ tech }: StackSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);
  const rafRef = useRef<number>(0);

  const featured = tech.filter((t) => t.featured);
  const allTech = expanded ? tech : featured.length > 0 ? featured : tech;
  const hasMore = featured.length > 0 && featured.length < tech.length && !expanded;

  const handleMouseMove = useCallback((e: React.MouseEvent, idx: number) => {
    const element = e.currentTarget as HTMLElement;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 12,
      });
      setHoveredIdx(idx);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setHoveredIdx(null);
  }, []);

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
        scrollTrigger: { trigger: ".stack-perspective", start: "top 80%", toggleActions: "play none none reverse" },
      });

      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, [expanded]);

  function getCardClass(idx: number): string {
    if (hoveredIdx === null) return "stack-card";
    if (idx === hoveredIdx) return "stack-card stack-card--active";
    if (idx === hoveredIdx - 1 || idx === hoveredIdx + 1) return "stack-card stack-card--neighbor";
    if (idx === hoveredIdx - 2 || idx === hoveredIdx + 2) return "stack-card stack-card--neighbor-2";
    return "stack-card stack-card--dim";
  }

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
        <div className="stack-perspective" ref={gridRef}>
          <div className="stack-row">
            {allTech.map((t, i) => {
              const color = getBrandColor(t.name);
              return (
                <button
                  key={t._id}
                  className={getCardClass(i)}
                  data-tilt
                  type="button"
                  aria-label={`${t.name}${t.cat ? ` — ${t.cat}` : ""}${t.featured ? " (featured)" : ""}`}
                  style={{ "--tech-color": color } as React.CSSProperties}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => setHoveredIdx(i)}
                  onBlur={() => setHoveredIdx(null)}
                >
                  <span className="stack-card__glow" aria-hidden="true" />
                  <div className="stack-card__logo">
                    {t.logo ? (
                      <img src={t.logo} alt="" loading="lazy" />
                    ) : (
                      <span className="stack-card__fallback" aria-hidden="true">
                        {t.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="stack-card__name">{t.name}</span>
                  {t.cat && <span className="stack-card__cat">{t.cat}</span>}
                  {t.featured && <span className="stack-card__star" aria-hidden="true">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {hasMore && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.5)",
                padding: "10px 28px",
                borderRadius: 999,
                fontSize: 13,
                letterSpacing: "0.08em",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              View All {tech.length} Tools
            </button>
          </div>
        )}

        {expanded && featured.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.35)",
                padding: "6px 16px",
                fontSize: 12,
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >
              Show Featured Only
            </button>
          </div>
        )}

        {hoveredIdx !== null && (
          <div
            className="stack-tooltip"
            role="tooltip"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            {allTech[hoveredIdx]?.name}
          </div>
        )}
      </div>
    </section>
  );
}
