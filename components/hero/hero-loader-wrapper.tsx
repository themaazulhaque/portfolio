"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ImageSequenceHero } from "./image-sequence-hero";
import { ScrollTrigger } from "../../lib/gsap";

const TIMEOUT_MS = 12000;
const FRAMES_BEFORE_READY = 8;
const HELLO_ANIM_MS = 1600;
const HELLO_HOLD_MS = 600;

function HelloIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"reveal" | "hold" | "exit">("reveal");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), HELLO_ANIM_MS);
    const t2 = setTimeout(() => setPhase("exit"), HELLO_ANIM_MS + HELLO_HOLD_MS);
    const t3 = setTimeout(onDone, HELLO_ANIM_MS + HELLO_HOLD_MS + 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="hello-intro"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-1, #060608)",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      <style>{`
        .hello-text {
          font-family: 'Caveat', cursive;
          font-weight: 500;
          font-size: clamp(48px, 10vw, 96px);
          color: var(--accent-warm, #c9a96e);
          letter-spacing: 0.06em;
          line-height: 1;
          position: relative;
          overflow: hidden;
        }
        .hello-text-inner {
          display: inline-block;
          transform: translateY(12px);
          opacity: 0;
        }
        .hello-text.reveal .hello-text-inner {
          animation: helloReveal ${HELLO_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hello-text.hold .hello-text-inner {
          transform: translateY(0);
          opacity: 1;
        }
        .hello-text.exit .hello-text-inner {
          animation: helloExit 0.45s cubic-bezier(0.4, 0, 0.8, 0.2) forwards;
        }
        @keyframes helloReveal {
          0% {
            opacity: 0;
            transform: translateY(12px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        @keyframes helloExit {
          0% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-8px);
            filter: blur(3px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hello-text-inner {
            opacity: 1;
            transform: none;
            filter: none;
            animation: none !important;
          }
        }
      `}</style>
      <span className={`hello-text ${phase}`} role="img" aria-label="hello">
        <span className="hello-text-inner">hello</span>
      </span>
    </div>
  );
}

function HeroLoaderOverlay({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);

  return (
    <div
      className="hero-loader-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <style>{`
        @keyframes heroLoaderSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes heroLoaderPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .hero-loader-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.08);
          border-top-color: rgba(255,255,255,0.7);
          animation: heroLoaderSpin 1s linear infinite;
        }
        .hero-loader-text {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-top: 20px;
          animation: heroLoaderPulse 2s ease-in-out infinite;
        }
        .hero-loader-pct {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.3);
          margin-top: 8px;
          font-variant-numeric: tabular-nums;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-loader-ring { animation: none; border-top-color: rgba(255,255,255,0.4); }
          .hero-loader-text { animation: none; }
        }
      `}</style>
      <div className="hero-loader-ring" />
      <div className="hero-loader-text">Loading Experience</div>
      <div className="hero-loader-pct">{pct}%</div>
    </div>
  );
}

export function HeroLoaderWrapper({
  name,
  title,
  availability,
}: {
  name?: string;
  title?: string;
  availability?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [helloDone, setHelloDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq?.matches ?? false);
    setHydrated(true);
  }, []);

  const handleProgress = useCallback((loaded: number, total: number) => {
    const p = Math.min(loaded / total, 1);
    setProgress(p);
    if (loaded >= FRAMES_BEFORE_READY && !ready) {
      setReady(true);
    }
  }, [ready]);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && showLoader) {
      const t = setTimeout(() => setShowLoader(false), 400);
      return () => clearTimeout(t);
    }
  }, [ready, showLoader]);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setReady(true);
    }, TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleHelloDone = useCallback(() => setHelloDone(true), []);

  const lockBody = !reducedMotion && (!helloDone || showLoader);
  const prevLockRef = useRef(false);

  useEffect(() => {
    if (lockBody) {
      document.body.style.overflow = "hidden";
    } else if (prevLockRef.current) {
      document.body.style.overflow = "";
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
    prevLockRef.current = lockBody;
  }, [lockBody]);

  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (reducedMotion) {
    return (
      <ImageSequenceHero
        name={name}
        title={title}
        availability={availability}
      />
    );
  }

  if (!hydrated) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#060608" }} />
    );
  }

  return (
    <>
      {!helloDone && (
        <HelloIntro onDone={handleHelloDone} />
      )}
      {showLoader && helloDone && (
        <HeroLoaderOverlay progress={progress} />
      )}
      <div
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <ImageSequenceHero
          name={name}
          title={title}
          availability={availability}
          onProgress={handleProgress}
          onReady={handleReady}
        />
      </div>
    </>
  );
}
