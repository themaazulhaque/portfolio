"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import type { PublicSettings, PublicSocialLink } from "../../lib/types";

interface FooterSectionProps {
  settings: PublicSettings;
  socialLinks: PublicSocialLink[];
}

/**
 * Footer — minimal · luxury. Large CTA, three-column lower band,
 * magnetic back-to-top. GSAP reveals on scroll.
 */
export function FooterSection({ settings, socialLinks }: FooterSectionProps) {
  const footerRef = useRef<HTMLElement | null>(null);
  const ownerName = settings.name || "Maazul Haque";
  const locationValue = settings.location || "Dhaka · Worldwide";

  const socialItems = socialLinks
    .filter((l) => l.visible && l.url)
    .map((l) => ({ label: l.platform, href: l.url }));
  const footerSocials = [...socialItems];
  if (settings.email) {
    footerSocials.push({ label: "Email", href: `mailto:${settings.email}` });
  }

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".footer-cta-link", {
        opacity: 0,
        y: 60,
        filter: "blur(6px)",
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer-cta", start: "top 88%", toggleActions: "play none none reverse" }
      });
      gsap.from(".footer-lower > *", {
        opacity: 0,
        y: 24,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer-lower", start: "top 92%" }
      });
    }, footer);

    return () => ctx.revert();
  }, []);

  const handleToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer" ref={footerRef}>
      <div className="container">
        <div className="footer-cta">
          <p className="kicker">
            <span className="kicker-num">07</span> Start a project
          </p>
          <a className="footer-cta-link" href="#contact">
            Have an idea?
            <br />
            Let&apos;s build it <span className="footer-cta-arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="footer-lower">
          <div className="footer-info">
            <a className="footer-brand" href="#about">
              {ownerName}
            </a>
            <p className="footer-loc">{locationValue}</p>
          </div>
          <nav className="footer-socials" aria-label="Social links">
            {footerSocials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="footer-legal">
            <span>© {new Date().getFullYear()} {ownerName}</span>
            <button className="to-top" data-magnetic type="button" aria-label="Back to top" onClick={handleToTop}>
              ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
