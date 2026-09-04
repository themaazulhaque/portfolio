"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { availabilityLabel } from "../../lib/types";

const NAV_LINKS = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Work", href: "#projects" },
  { num: "03", label: "Career", href: "#experience" },
  { num: "04", label: "Stack", href: "#stack" },
  { num: "05", label: "Services", href: "#services" },
  { num: "06", label: "Contact", href: "#contact" }
];

const EASE = "power3.out";

type MagnetEntry = {
  xTo: ReturnType<typeof gsap.quickTo>;
  yTo: ReturnType<typeof gsap.quickTo>;
};

interface SiteNavProps {
  name?: string;
  email?: string;
  availability?: string;
}

/**
 * Persistent minimal top bar + ambient film grain + custom cursor + Fullscreen GSAP Nav Overlay.
 */
export function SiteNav({ name, email, availability }: SiteNavProps) {
  const brand = (name || "Maazul Haque").split(" ")[0];
  const contactEmail = email || "hello@maazul.dev";
  const statusLabel = availabilityLabel(availability || "available");
  const topbarRef = useRef<HTMLElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Toggle/Open Overlay handler with GSAP animation
  const handleOpenMenu = () => {
    setIsMenuOpen(true);
  };

  const handleCloseMenu = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.35,
        ease: EASE,
        onComplete: () => setIsMenuOpen(false)
      });
    } else {
      setIsMenuOpen(false);
    }
  };

  const handleLinkClick = (href: string) => {
    handleCloseMenu();
    setTimeout(() => {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }, 350);
  };

  // GSAP animation when menu opens
  useEffect(() => {
    if (isMenuOpen && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.45, ease: EASE }
      );
      gsap.fromTo(
        overlayRef.current.querySelectorAll(".menu-overlay-link"),
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: EASE, delay: 0.1 }
      );
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleCustomOpen = () => handleOpenMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) handleCloseMenu();
    };

    window.addEventListener("open-nav-menu", handleCustomOpen);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-nav-menu", handleCustomOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const topbar = topbarRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;

    const createdTriggers: ScrollTrigger[] = [];
    const magnetCache = new Map<HTMLElement, MagnetEntry>();
    let tickerFn: (() => void) | null = null;
    let raf = 0;
    let disposed = false;

    /* ---------- Top bar visibility ---------- */
    const aboutEl = document.getElementById("about");
    if (topbar) {
      if (reduced) {
        const onScroll = () => {
          if (window.scrollY > window.innerHeight * 0.8) topbar.classList.add("is-visible");
          else topbar.classList.remove("is-visible");
        };
        window.addEventListener("scroll", onScroll, { passive: true });
      } else {
        createdTriggers.push(
          ScrollTrigger.create({
            trigger: aboutEl,
            start: "top 95%",
            onEnter: () => topbar.classList.add("is-visible"),
            onLeaveBack: () => topbar.classList.remove("is-visible")
          })
        );
        createdTriggers.push(
          ScrollTrigger.create({
            trigger: document.body,
            start: "top -60vh",
            end: "max",
            onToggle: (self) => topbar.classList.toggle("is-pinned", self.isActive)
          })
        );
      }
    }

    /* ---------- Custom cursor (fine pointers only) ---------- */
    if (finePointer && !reduced && dot && ring) {
      document.body.classList.add("has-custom-cursor");

      const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const ringPos = { x: pos.x, y: pos.y };

      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: pos.x, y: pos.y });

      const onMouseMove = (e: MouseEvent) => {
        pos.x = e.clientX;
        pos.y = e.clientY;
      };
      window.addEventListener("mousemove", onMouseMove);

      tickerFn = () => {
        ringPos.x += (pos.x - ringPos.x) * 0.16;
        ringPos.y += (pos.y - ringPos.y) * 0.16;
        gsap.set(ring, { x: ringPos.x, y: ringPos.y });
        gsap.set(dot, { x: pos.x, y: pos.y });
      };
      gsap.ticker.add(tickerFn);

      const onOver = (e: MouseEvent) => {
        const t = e.target as HTMLElement | null;
        if (!t) return;
        if (t.closest("[data-project], .p-media, a, .c-row, .send-btn")) {
          document.body.classList.add("cursor-view");
        }
        if (t.closest(".tech-card, .t-entry, .service-card")) {
          document.body.classList.add("cursor-hover");
        }
      };
      const onOut = (e: MouseEvent) => {
        const t = e.target as HTMLElement | null;
        if (!t) return;
        if (t.closest("[data-project], .p-media, a, .c-row, .send-btn")) {
          document.body.classList.remove("cursor-view");
        }
        if (t.closest(".tech-card, .t-entry, .service-card")) {
          document.body.classList.remove("cursor-hover");
        }
      };
      document.addEventListener("mouseover", onOver);
      document.addEventListener("mouseout", onOut);
    }

    /* ---------- Magnetic elements (event delegation) ---------- */
    const onMagnetMove = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-magnetic]");
      if (!t) return;
      let entry = magnetCache.get(t);
      if (!entry) {
        entry = {
          xTo: gsap.quickTo(t, "x", { duration: 0.9, ease: EASE }),
          yTo: gsap.quickTo(t, "y", { duration: 0.9, ease: EASE })
        };
        magnetCache.set(t, entry);
      }
      const r = t.getBoundingClientRect();
      entry.xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
      entry.yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    };
    const onMagnetLeave = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-magnetic]");
      if (!t) return;
      const entry = magnetCache.get(t);
      if (entry) {
        entry.xTo(0);
        entry.yTo(0);
      }
    };
    document.addEventListener("mousemove", onMagnetMove);
    document.addEventListener("mouseout", onMagnetLeave);

    /* ---------- Refresh after layout settles (fonts, images, siblings) ---------- */
    raf = requestAnimationFrame(() => {
      if (!disposed) ScrollTrigger.refresh();
    });
    const fontsReady =
      typeof document !== "undefined" && document.fonts && document.fonts.ready
        ? document.fonts.ready.then(() => {
            if (!disposed) ScrollTrigger.refresh();
          })
        : Promise.resolve();
    window.addEventListener("load", () => {
      if (!disposed) ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      void fontsReady;
      createdTriggers.forEach((t) => t.kill());
      if (tickerFn) gsap.ticker.remove(tickerFn);
      document.body.classList.remove("has-custom-cursor", "cursor-view", "cursor-hover");
      magnetCache.clear();
    };
  }, []);

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true">
        <span className="cursor-view">View</span>
      </div>

      <header className="topbar" id="topbar" ref={topbarRef}>
        <a className="tb-brand" href="#about">
          <span className="tb-brand-dot" aria-hidden="true" />
          {brand}
        </a>
        <nav className="tb-index" aria-label="Section index">
          {NAV_LINKS.map((link) => (
            <a key={link.num} href={link.href}>
              <span className="tb-num">{link.num}</span>
              {link.label}
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <button
            className="tb-menu-trigger"
            type="button"
            aria-label="Open menu"
            onClick={handleOpenMenu}
          >
            MENU
          </button>
          <a className="tb-cta" data-magnetic href="#contact">
            Get in touch
          </a>
        </div>
      </header>

      {/* Fullscreen Overlay Navigation */}
      {isMenuOpen && (
        <div className="menu-overlay is-open" ref={overlayRef} role="dialog" aria-modal="true" aria-label="Navigation Menu">
          <div className="menu-overlay-header">
            <div className="tb-brand">
              <span className="tb-brand-dot" aria-hidden="true" />
              {brand}
            </div>
            <button
              className="menu-close-btn"
              type="button"
              data-magnetic
              onClick={handleCloseMenu}
              aria-label="Close Navigation Menu"
            >
              <span>Close</span>
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <nav className="menu-overlay-nav" aria-label="Fullscreen Navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.num}
                className="menu-overlay-link"
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
              >
                <span className="menu-num">{link.num}</span>
                <span>{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="menu-overlay-footer">
            <span className="has-dot">
              <span className="live-dot" aria-hidden="true" />
              {statusLabel}
            </span>
            <a href={`mailto:${contactEmail}`} style={{ color: "var(--fg-1)" }}>
              {contactEmail}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
