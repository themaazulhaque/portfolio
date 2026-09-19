"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ImageSequenceHero } from "./image-sequence-hero";
import { ScrollTrigger } from "../../lib/gsap";

const TIMEOUT_MS = 12000;
const FRAMES_BEFORE_READY = 8;
const HELLO_DRAW_MS = 1200;
const HELLO_HOLD_MS = 800;

function HelloSVG({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"draw" | "hold" | "exit">("draw");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), HELLO_DRAW_MS);
    const t2 = setTimeout(() => setPhase("exit"), HELLO_DRAW_MS + HELLO_HOLD_MS);
    const t3 = setTimeout(onDone, HELLO_DRAW_MS + HELLO_HOLD_MS + 500);
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
        background: "#ffffff",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 0.45s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      <style>{`
        .hello-svg path {
          fill: none;
          stroke: #111111;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: var(--path-len);
          stroke-dashoffset: var(--path-len);
        }
        .hello-svg.draw path {
          animation: helloStroke var(--draw-dur, ${HELLO_DRAW_MS}ms) var(--draw-delay, 0ms) cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .hello-svg.hold path {
          stroke-dashoffset: 0;
        }
        .hello-svg.exit path {
          stroke-dashoffset: calc(-1 * var(--path-len));
          transition: stroke-dashoffset 0.4s cubic-bezier(0.4,0,0.8,0.2);
        }
        @keyframes helloStroke {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hello-svg path {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
        }
      `}</style>
      <svg
        className={`hello-svg ${phase}`}
        viewBox="0 0 260 100"
        width="clamp(160px, 40vw, 280px)"
        height="auto"
        aria-label="hello"
        role="img"
      >
        {/* h */}
        <path
          d="M 20 80 L 20 20 C 20 14, 24 10, 30 10 C 36 10, 40 14, 40 20 L 40 46"
          style={{ "--path-len": 120, "--draw-dur": "220ms", "--draw-delay": "0ms" } as React.CSSProperties}
        />
        {/* e */}
        <path
          d="M 48 42 C 48 42, 68 38, 68 50 C 68 62, 48 60, 48 48"
          style={{ "--path-len": 80, "--draw-dur": "200ms", "--draw-delay": "200ms" } as React.CSSProperties}
        />
        {/* l */}
        <path
          d="M 82 80 L 82 14"
          style={{ "--path-len": 66, "--draw-dur": "140ms", "--draw-delay": "380ms" } as React.CSSProperties}
        />
        {/* l */}
        <path
          d="M 100 80 L 100 14"
          style={{ "--path-len": 66, "--draw-dur": "140ms", "--draw-delay": "500ms" } as React.CSSProperties}
        />
        {/* o */}
        <path
          d="M 128 48 C 128 32, 118 32, 118 48 C 118 64, 128 64, 128 48"
          style={{ "--path-len": 80, "--draw-dur": "260ms", "--draw-delay": "620ms" } as React.CSSProperties}
        />
      </svg>
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
  const [isMobile, setIsMobile] = useState(false);
  const [helloDone, setHelloDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq?.matches ?? false);
    setIsMobile(window.innerWidth < 768);
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

  const lockBody = (isMobile && !reducedMotion && !helloDone) || (showLoader && !reducedMotion);
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
      <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#0a0a0a" }} />
    );
  }

  return (
    <>
      {isMobile && !helloDone && (
        <HelloSVG onDone={handleHelloDone} />
      )}
      {showLoader && (helloDone || !isMobile) && (
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
