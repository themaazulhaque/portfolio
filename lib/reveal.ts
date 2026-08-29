import { gsap } from "./gsap";

/**
 * Editorial masthead + headline reveal: clip-path wipe from the
 * bottom of the glyph block. Mirrors the approved design's
 * `.masthead, .contact-headline` reveal. Scoped to `scope`.
 */
export function revealClip(scope: HTMLElement): void {
  scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, {
      clipPath: "inset(0 0 0% 0)",
      duration: 1.3,
      ease: "power3.out",
      immediateRender: false,
      scrollTrigger: { trigger: el, start: "top 84%", toggleActions: "play none none reverse" }
    });
  });
}
