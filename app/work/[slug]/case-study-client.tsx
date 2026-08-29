"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "../../../lib/gsap";
import { revealClip } from "../../../lib/reveal";

interface CaseStudyClientProps {
  children: ReactNode;
}

export default function CaseStudyClient({ children }: CaseStudyClientProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    mountedRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let ctx: ReturnType<typeof gsap.context> | null = null;

    const initAnimations = () => {
      if (!mountedRef.current || !pageRef.current) return;

      ctx = gsap.context(() => {
        page.querySelectorAll<HTMLElement>("[data-case-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              immediateRender: false,
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
              },
            }
          );
        });

        revealClip(page);
      }, page);
    };

    const timer = requestAnimationFrame(() => {
      initAnimations();
    });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(timer);
      if (ctx) {
        ctx.revert();
      }
    };
  }, []);

  return (
    <div ref={pageRef} className="case-study-page">
      {children}
    </div>
  );
}
