"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicExperience } from "../../lib/types";

interface ExperienceSectionProps {
  experiences: PublicExperience[];
}

/**
 * 03 · EXPERIENCE — editorial timeline. Drawn progress line,
 * scrubbed year parallax, cinematic entry reveals.
 */
export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const careerProgress = section.querySelector("#careerProgress");
      if (careerProgress) {
        gsap.fromTo(careerProgress, { scaleY: 0 }, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".timeline",
            start: "top 75%",
            end: "bottom 60%",
            scrub: 0.5
          }
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-entry]").forEach((item) => {
        gsap.fromTo(item,
          { opacity: 0, y: 64 },
          {
            opacity: 1, y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 84%", toggleActions: "play none none reverse" }
          }
        );
        const year = item.querySelector<HTMLElement>(".t-year");
        if (year && window.matchMedia("(min-width: 769px)").matches) {
          gsap.fromTo(year, { y: 90 }, {
            y: -30,
            ease: "none",
            scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: 1 }
          });
        }
      });

      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section experience" id="experience" ref={sectionRef} aria-label="Experience">
      <div className="container section-head">
        <div>
          <p className="kicker">
            <span className="kicker-num">03</span> Career
          </p>
          <h2 className="masthead" data-reveal>
            Experience
          </h2>
        </div>
        <p className="head-meta">
          {experiences.length > 0 ? `${experiences[experiences.length - 1].year} — present` : "Career"}
          <br />
          {experiences.length > 1 ? `${experiences.length} chapters` : "One chapter"}
        </p>
      </div>

      <div className="container">
        <div className="timeline">
          <div className="timeline-line" aria-hidden="true">
            <span id="careerProgress" />
          </div>

          {experiences.map((entry) => (
            <article className="t-entry" data-entry key={entry.index}>
              <div className="t-period">
                <span className="t-year serif">{entry.year}</span>
                <span className="t-period-end">{entry.periodEnd}</span>
              </div>
              <div className="t-main">
                <span className="t-index serif" aria-hidden="true">
                  {entry.index}
                </span>
                <h3 className="t-role">{entry.role}</h3>
                <p className="t-co">{entry.co}</p>
                <p className="t-desc">{entry.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
