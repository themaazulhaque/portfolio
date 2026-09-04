"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import { availabilityLabel } from "../../lib/types";

const EASE = "power3.out";

interface AboutSectionProps {
  name?: string;
  location?: string;
  availability?: string;
  portrait?: string;
}

/**
 * 01 · ABOUT — oversized ghost word, editorial composition,
 * clip-reveal portrait, masked statement lines.
 */
export function AboutSection({ name, location, availability, portrait }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const firstName = (name || "Maazul Haque").split(" ")[0];
  const portraitSrc = portrait || "/frames/ezgif-frame-150.jpg";
  const locationValue = location || "Dhaka · Worldwide";
  const statusValue = availabilityLabel(availability || "available");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const ghost = section.querySelector(".ghost-word");
      const frame = section.querySelector(".portrait-frame");
      const aboutPortrait = section.querySelector(".about-portrait");

      if (ghost) {
        gsap.fromTo(ghost, { xPercent: -50, y: 60 }, {
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 }
        });
      }

      if (frame) {
        gsap.fromTo(frame, { clipPath: "inset(12% 12% 12% 12%)", scale: 0.96 }, {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1.4,
          ease: EASE,
          scrollTrigger: { trigger: frame, start: "top 78%", toggleActions: "play none none reverse" }
        });
      }
      if (aboutPortrait) {
        gsap.to(".portrait-img", {
          yPercent: -7,
          ease: "none",
          scrollTrigger: { trigger: ".about-portrait", start: "top bottom", end: "bottom top", scrub: 1 }
        });
        gsap.to(".portrait-ghost", {
          y: -40,
          ease: "none",
          scrollTrigger: { trigger: ".about-portrait", start: "top bottom", end: "bottom top", scrub: 1 }
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 48, filter: "blur(8px)" },
          {
            opacity: 1, y: 0, filter: "blur(0px)",
            duration: 1.2,
            delay: i * 0.14,
            ease: EASE,
            scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" }
          }
        );
      });

      gsap.from(".detail-row", {
        opacity: 0,
        y: 24,
        stagger: 0.1,
        duration: 0.9,
        ease: EASE,
        scrollTrigger: { trigger: ".detail-list", start: "top 85%", toggleActions: "play none none reverse" }
      });

      revealClip(section);

      gsap.from(".next-chapter", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: EASE,
        scrollTrigger: { trigger: ".next-chapter", start: "top 92%", toggleActions: "play none none reverse" }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section about" id="about" ref={sectionRef} aria-label="About">
      <div className="ghost-word" data-ghost aria-hidden="true">
        PROFILE
      </div>

      <div className="container">
        <div className="about-top">
          <p className="kicker">
            <span className="kicker-num">01</span> Profile
          </p>
          <h2 className="masthead" data-reveal>
            About
          </h2>
        </div>

        <div className="about-grid">
          <figure className="about-portrait">
            <span className="portrait-ghost serif" aria-hidden="true">
              01
            </span>
            <div className="portrait-frame">
              <div className="portrait-img">
                <img
                  src={portraitSrc}
                  alt="Portrait — cinematic still from the hero sequence"
                  loading="lazy"
                />
              </div>
            </div>
            <figcaption className="portrait-cap">Portrait · Frame 150</figcaption>
          </figure>

          <div className="about-body">
            <p className="statement" data-lines>
              {firstName} is a software and AI engineer who{" "}
              <em className="serif-accent">designs, builds, and ships</em> products
              that move fast and feel quiet.
            </p>
            <p className="about-paragraph" data-lines>
              He works where interface meets intelligence — turning ideas into fast, precise, quiet
              products. Eight years across the stack, from pixels to pipelines.
            </p>

            <dl className="detail-list">
              <div className="detail-row">
                <dt>Location</dt>
                <dd>{locationValue}</dd>
              </div>
              <div className="detail-row">
                <dt>Focus</dt>
                <dd>AI Products · Web platforms</dd>
              </div>
              <div className="detail-row">
                <dt>Status</dt>
                <dd className="has-dot">
                  <span className="live-dot" aria-hidden="true" />
                  {statusValue}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="next-chapter">
          <span>Next</span>
          <a href="#projects">
            Selected work <span className="arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
