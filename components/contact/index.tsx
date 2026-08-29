"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { gsap } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import { availabilityLabel, type PublicSettings, type PublicSocialLink } from "../../lib/types";
import { createContactMessage } from "../../app/actions/messages";

const EASE = "power3.out";

type ContactRow = {
  label: string;
  value?: string;
  href?: string;
  dot?: boolean;
};

interface ContactSectionProps {
  settings: PublicSettings;
  socialLinks: PublicSocialLink[];
}

function socialDisplay(url: string, platform: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "");
    return `${host}${u.pathname !== "/" ? u.pathname : ""}`;
  } catch {
    return platform;
  }
}

function buildRows(settings: PublicSettings, socialLinks: PublicSocialLink[]): ContactRow[] {
  const rows: ContactRow[] = [];

  for (const link of socialLinks) {
    if (!link.visible || !link.url) continue;
    rows.push({
      label: link.platform,
      value: socialDisplay(link.url, link.platform),
      href: link.url
    });
  }

  if (settings.email) {
    rows.push({ label: "Email", value: settings.email, href: `mailto:${settings.email}` });
  }

  if (settings.resumeUrl) {
    rows.push({ label: "Resume", value: "Download PDF", href: settings.resumeUrl });
  }

  if (settings.location) {
    rows.push({ label: "Location", value: settings.location });
  }

  rows.push({
    label: "Availability",
    value: availabilityLabel(settings.availability || "available"),
    dot: true
  });

  return rows;
}

/**
 * 06 · CONTACT — split editorial + form. Premium underline inputs
 * (scaleX 0 → 1 on focus), magnetic send button, GSAP stagger reveals.
 */
export function ContactSection({ settings, socialLinks }: ContactSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rows = buildRows(settings, socialLinks);

  const [state, action, pending] = useActionState(createContactMessage, {});
  const sent = Boolean((state as { success?: boolean }).success);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      revealClip(section);

      gsap.from(".contact-left .field, .send-btn", {
        opacity: 0,
        y: 26,
        stagger: 0.08,
        duration: 0.9,
        ease: EASE,
        scrollTrigger: { trigger: ".contact-form", start: "top 82%", toggleActions: "play none none reverse" }
      });

      gsap.from(".c-row", {
        opacity: 0,
        x: 30,
        stagger: 0.08,
        duration: 0.9,
        ease: EASE,
        scrollTrigger: { trigger: ".contact-rows", start: "top 82%", toggleActions: "play none none reverse" }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!sent) return;
    const btn = sectionRef.current?.querySelector<HTMLElement>(".send-btn");
    if (btn) {
      gsap.to(btn, { scale: 0.96, duration: 0.15, yoyo: true, repeat: 1, ease: EASE });
    }
  }, [sent]);

  return (
    <section className="section contact" id="contact" ref={sectionRef} aria-label="Contact">
      <div className="container">
        <p className="kicker">
          <span className="kicker-num">06</span> Contact
        </p>

        <div className="contact-grid">
          <div className="contact-left">
            <h2 className="contact-headline" data-reveal>
              Let&apos;s build something{" "}
              <em className="serif-accent serif-accent--lg">exceptional</em>.
            </h2>

            <form className="contact-form" id="contactForm" noValidate action={action}>
              <div className="field">
                <label htmlFor="cf-name">Name</label>
                <input id="cf-name" name="name" type="text" placeholder="Your name" autoComplete="name" required />
              </div>
              <div className="field">
                <label htmlFor="cf-email">Email</label>
                <input id="cf-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="cf-subject">Subject</label>
                <input id="cf-subject" name="subject" type="text" placeholder="What is this about?" autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="cf-msg">Message</label>
                <textarea id="cf-msg" name="message" rows={4} placeholder="Tell me about the work…" required />
              </div>
              <button className={`send-btn${sent ? " is-sent" : ""}`} data-magnetic type="submit" disabled={pending}>
                <span className="send-label">{sent ? "Message sent" : pending ? "Sending…" : "Send message"}</span>
                <span className="send-arrow" aria-hidden="true">
                  {sent ? "✓" : "↗"}
                </span>
              </button>
            </form>
          </div>

          <aside className="contact-right">
            <p className="contact-right-title">Elsewhere</p>
            <div className="contact-rows">
              {rows.map((row) => {
                const inner = (
                  <>
                    <span className="c-label">{row.label}</span>
                    <span className={`c-value${row.dot ? " has-dot" : ""}`}>
                      {row.dot && <span className="live-dot" aria-hidden="true" />}
                      {row.value}
                    </span>
                    <span className="c-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </>
                );
                return row.href ? (
                  <a className="c-row" href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel={row.href.startsWith("http") ? "noopener" : undefined} key={row.label}>
                    {inner}
                  </a>
                ) : (
                  <div className="c-row" key={row.label}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
