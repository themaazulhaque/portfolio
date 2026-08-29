"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicProject } from "../../lib/types";

interface ProjectsSectionProps {
  projects: PublicProject[];
}

/**
 * 02 · FEATURED PROJECTS — cinematic pinned horizontal rail.
 * Desktop: pinned scroll (GSAP pin + scrub). Mobile: native
 * horizontal scroll with snap + progress bar.
 */
export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const rail = railRef.current;
    const progress = progressRef.current;
    if (!section || !viewport || !rail) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktopMQ = window.matchMedia("(min-width: 768px)");

    let horizontalTrigger: gsap.core.Tween | null = null;
    let progressTrigger: gsap.core.Tween | null = null;

    const updateNativeProgress = () => {
      if (!progress) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      progress.style.transform =
        max > 0 ? `scaleX(${Math.min(1, viewport.scrollLeft / max)})` : "scaleX(0)";
    };

    const nativeRailMode = () => {
      viewport.style.overflowX = "auto";
      viewport.style.cursor = "grab";
      viewport.style.scrollSnapType = "x proximity";
      section.querySelectorAll<HTMLElement>(".project-card").forEach((c) => {
        c.style.scrollSnapAlign = "start";
      });
      updateNativeProgress();
    };

    const pinnedRailMode = () => {
      viewport.style.overflowX = "hidden";
      viewport.style.cursor = "auto";
      viewport.style.scrollSnapType = "none";
      section.querySelectorAll<HTMLElement>(".project-card").forEach((c) => {
        c.style.scrollSnapAlign = "";
      });

      const distance = () => rail.scrollWidth - viewport.offsetWidth;
      if (distance() <= 0) return;

      horizontalTrigger = gsap.to(rail, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: viewport,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      if (progress) {
        progressTrigger = gsap.fromTo(progress, { scaleX: 0 }, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: viewport,
            start: "top top",
            end: () => "+=" + distance(),
            scrub: true
          }
        });
      }
    };

    const killTriggers = () => {
      if (horizontalTrigger) {
        horizontalTrigger.scrollTrigger?.kill();
        horizontalTrigger.kill();
        horizontalTrigger = null;
      }
      if (progressTrigger) {
        progressTrigger.scrollTrigger?.kill();
        progressTrigger.kill();
        progressTrigger = null;
      }
    };

    const setupProjects = () => {
      killTriggers();
      if (desktopMQ.matches) pinnedRailMode();
      else nativeRailMode();
    };

    viewport.addEventListener("scroll", updateNativeProgress, { passive: true });

    if (reduced) {
      nativeRailMode();
    } else {
      setupProjects();
    }
    desktopMQ.addEventListener("change", () => {
      if (reduced) return;
      setupProjects();
      ScrollTrigger.refresh();
    });

    return () => {
      killTriggers();
      viewport.removeEventListener("scroll", updateNativeProgress);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      section.querySelectorAll<HTMLElement>(".project-card:not(.project-card--outro)").forEach((card) => {
        const img = card.querySelector<HTMLImageElement>(".p-media img");
        const title = card.querySelector<HTMLElement>(".p-title");
        const media = card.querySelector<HTMLElement>(".p-media");
        if (!media) return;

        if (img) {
          gsap.fromTo(img, { scale: 1.22 }, {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "left 110%",
              end: "left 30%",
              scrub: 0.8
            }
          });
        }
        gsap.fromTo(media, { clipPath: "inset(0 0 100% 0)" }, {
          clipPath: "inset(0 0 0% 0)",
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "left 96%",
            end: "left 45%",
            scrub: 0.8
          }
        });
        if (title) {
          gsap.fromTo(title, { y: 60 }, {
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "left 80%",
              end: "left 30%",
              scrub: 0.6
            }
          });
        }
      });

      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section projects" id="projects" ref={sectionRef} aria-label="Featured projects">
      <div className="container section-head">
        <div>
          <p className="kicker">
            <span className="kicker-num">02</span> Selected work
          </p>
          <h2 className="masthead" data-reveal>
            Featured Projects
          </h2>
        </div>
        <p className="head-meta">
          Scroll the rail
          <br />
          {projects.length > 1 ? `${projects.length} launches` : "One launch"}
        </p>
      </div>

      <div className="projects-viewport" ref={viewportRef} id="projectsViewport">
        <div className="projects-rail" ref={railRef} id="projectsRail">
          {projects.map((project) => {
            const hasLiveDemo = Boolean(project.liveUrl && project.liveUrl.startsWith("http"));

            const handleCardClick = () => {
              if (hasLiveDemo && project.liveUrl) {
                window.open(project.liveUrl, "_blank", "noopener,noreferrer");
              }
            };

            const handlePlayClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (hasLiveDemo && project.liveUrl) {
                window.open(project.liveUrl, "_blank", "noopener,noreferrer");
              }
            };

            const handleCardKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                if (hasLiveDemo) {
                  e.preventDefault();
                  handleCardClick();
                }
              }
            };

            const handlePlayKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (hasLiveDemo && project.liveUrl) {
                  window.open(project.liveUrl, "_blank", "noopener,noreferrer");
                }
              }
            };

            return (
              <article
                className={`project-card ${!hasLiveDemo ? "project-card--no-live" : ""}`}
                data-project
                key={project.num}
                onClick={handleCardClick}
                onKeyDown={handleCardKeyDown}
                tabIndex={hasLiveDemo ? 0 : -1}
                role={hasLiveDemo ? "button" : "region"}
                aria-label={`${project.title} project card${hasLiveDemo ? " — click to open live demo" : ""}`}
                style={{ cursor: hasLiveDemo ? "pointer" : "default" }}
              >
                <div className="p-media">
                  {project.image ? (
                    <img src={project.image} alt={`${project.title} — ${project.cat}`} loading="lazy" />
                  ) : (
                    <div className="p-img-placeholder" aria-hidden="true" />
                  )}
                  <div className="p-shade" aria-hidden="true" />
                  <span className="p-num serif" aria-hidden="true">
                    {project.num}
                  </span>
                  <span
                    className={`p-play ${!hasLiveDemo ? "p-play--disabled" : ""}`}
                    aria-label={hasLiveDemo ? `Open ${project.title} live demo` : "Live demo coming soon"}
                    title={hasLiveDemo ? `Open ${project.title} live demo` : "Live demo coming soon"}
                    role="button"
                    tabIndex={0}
                    onClick={handlePlayClick}
                    onKeyDown={handlePlayKeyDown}
                    style={{ cursor: hasLiveDemo ? "pointer" : "not-allowed" }}
                  >
                    {hasLiveDemo ? (
                      <span className="p-play-tri" aria-hidden="true" />
                    ) : (
                      <svg className="p-lock-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    )}
                  </span>
                  <div className="p-veil">
                    <span className="p-cat">{project.cat}</span>
                    <h3 className="p-title">{project.title}</h3>
                  </div>
                  <button
                    className="p-view"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/work/${project.slug}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/work/${project.slug}`);
                      }
                    }}
                    aria-label={`View case study for ${project.title}`}
                    style={{ cursor: "pointer", background: "none", border: 0, font: "inherit", color: "inherit" }}
                  >
                    View case <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </article>
            );
          })}

          <a className="project-card project-card--outro" href="#contact" data-project>
            <span className="p-num p-num--outro serif" aria-hidden="true">
              {String(projects.length + 1).padStart(2, "0")}
            </span>
            <div className="p-outro-inner">
              <span className="p-cat">Next</span>
              <h3 className="p-title p-title--outro">Your project here</h3>
              <p className="p-desc">Have something in mind? Let&apos;s build it together.</p>
            </div>
            <span className="p-view">
              Start a project <span aria-hidden="true">↗</span>
            </span>
          </a>
        </div>
        <div className="projects-progress" aria-hidden="true">
          <span ref={progressRef} id="projectsProgress" />
        </div>
      </div>
    </section>
  );
}
