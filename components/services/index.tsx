"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicService } from "../../lib/types";

interface ServicesSectionProps {
  services: PublicService[];
}

/**
 * 05 · SERVICES — premium cards in a hairline grid. Subtle CSS
 * hover (surface lift, top accent line, title/index brighten,
 * arrow slide) plus a GSAP stagger entry reveal.
 */
export function ServicesSection({ services }: ServicesSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = section.querySelectorAll<HTMLElement>("[data-svc]");
      if (!cards.length) return;

      gsap.from(cards, {
        opacity: 0,
        y: 40,
        stagger: 0.08,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".service-grid", start: "top 80%", toggleActions: "play none none reverse" }
      });

      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section services" id="services" ref={sectionRef} aria-label="Services">
      <div className="container section-head">
        <div>
          <p className="kicker">
            <span className="kicker-num">05</span> Services
          </p>
          <h2 className="masthead" data-reveal>
            What I Do
          </h2>
        </div>
        <p className="head-meta">
          {services.length > 1 ? `${services.length} capabilities` : services.length === 1 ? "One capability" : "No capabilities"}
          <br />
          One standard
        </p>
      </div>

      <div className="container">
        <div className="service-grid" id="serviceGrid">
          {services.map((service) => (
            <article className="service-card" data-svc key={service._id}>
              <div className="sc-top">
                <span className="sc-index serif">{service.index}</span>
                <span className="sc-tag">{service.tag}</span>
              </div>
              <div className="sc-body">
                <h3 className="sc-title">{service.title}</h3>
                <p className="sc-desc">{service.desc}</p>
              </div>
              <a className="sc-link" href="#contact">
                Explore <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
