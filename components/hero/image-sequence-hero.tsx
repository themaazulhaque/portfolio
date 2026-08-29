"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { availabilityLabel } from "../../lib/types";

const FRAME_COUNT = 300;
const MAX_CONCURRENT_LOADS = 6;
const PRIORITY_INITIAL_BATCH = 30;

type FrameAsset = {
  source: CanvasImageSource;
  width: number;
  height: number;
  bitmap?: ImageBitmap;
};

type SurfaceContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

gsap.registerPlugin(ScrollTrigger);

function frameUrl(index: number): string {
  return `/frames/ezgif-frame-${String(index).padStart(3, "0")}.jpg`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateCoverRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: (targetWidth - width) * 0.5,
    y: (targetHeight - height) * 0.5,
    width,
    height
  };
}

export function ImageSequenceHero({
  name,
  title,
  availability
}: {
  name?: string;
  title?: string;
  availability?: string;
}) {
  const stageRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const displayName = (name || "Maazul Haque").toUpperCase();
  const subtitle = (title || "Software Engineer").toUpperCase();
  const availabilityTag = availabilityLabel(availability || "available").toUpperCase();

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;

    if (!stage || !viewport || !canvas) return;

    let canceled = false;
    let scrollTriggerInstance: ScrollTrigger | null = null;
    let renderAnimationFrameId: number = 0;
    let activeLoads = 0;

    const loadedMap = new Map<number, FrameAsset>();
    const pendingLoads = new Set<number>();
    const loadQueue: number[] = [];

    // Canvas scaling & DPR setup
    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;

    const updateDimensions = () => {
      const rect = viewport.getBoundingClientRect();
      cssWidth = Math.max(1, Math.round(rect.width));
      cssHeight = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };

    updateDimensions();

    // Canvas contexts & OffscreenCanvas support check
    const mainCtx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!mainCtx) return;

    const isOffscreenSupported = typeof OffscreenCanvas !== "undefined";
    let offscreenCanvas: OffscreenCanvas | null = null;
    let offscreenCtx: SurfaceContext | null = null;

    if (isOffscreenSupported) {
      offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      offscreenCtx = offscreenCanvas.getContext("2d", { alpha: true, desynchronized: true }) as SurfaceContext | null;
    }

    const drawTargetCtx = (offscreenCtx || mainCtx) as CanvasRenderingContext2D;

    // Render tracker
    let lastRenderedFrame = -1;
    let currentTargetFrame = 1;

    const renderCanvasFrame = (frameIdx: number) => {
      if (canceled) return;

      // Check loadedMap or find closest available loaded frame to prevent flickers
      let asset = loadedMap.get(frameIdx);
      if (!asset) {
        // Fallback search to closest cached frame
        for (let offset = 1; offset < FRAME_COUNT; offset++) {
          if (frameIdx - offset >= 1 && loadedMap.has(frameIdx - offset)) {
            asset = loadedMap.get(frameIdx - offset);
            break;
          }
          if (frameIdx + offset <= FRAME_COUNT && loadedMap.has(frameIdx + offset)) {
            asset = loadedMap.get(frameIdx + offset);
            break;
          }
        }
      }

      if (!asset) return;

      if (offscreenCanvas && (offscreenCanvas.width !== canvas.width || offscreenCanvas.height !== canvas.height)) {
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
      }

      const rect = calculateCoverRect(asset.width, asset.height, canvas.width, canvas.height);

      drawTargetCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawTargetCtx.drawImage(asset.source, rect.x, rect.y, rect.width, rect.height);

      if (offscreenCanvas && mainCtx) {
        mainCtx.clearRect(0, 0, canvas.width, canvas.height);
        mainCtx.drawImage(offscreenCanvas, 0, 0);
      }

      lastRenderedFrame = frameIdx;
    };

    const requestFrameDraw = (targetIdx: number) => {
      currentTargetFrame = targetIdx;
      if (renderAnimationFrameId) return;

      renderAnimationFrameId = requestAnimationFrame(() => {
        renderAnimationFrameId = 0;
        if (currentTargetFrame !== lastRenderedFrame) {
          renderCanvasFrame(currentTargetFrame);
        }
      });
    };

    // Frame asset loader: createImageBitmap > Image HTML fallback
    const loadFrameAsset = async (frameIdx: number): Promise<FrameAsset> => {
      const url = frameUrl(frameIdx);

      if (typeof createImageBitmap === "function" && typeof fetch === "function") {
        try {
          const res = await fetch(url, { cache: "force-cache" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          return { source: bitmap, width: bitmap.width, height: bitmap.height, bitmap };
        } catch {
          // Fall back to Image element load
        }
      }

      return new Promise<FrameAsset>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = (err) => reject(err);
        img.src = url;
      });
    };

    // Progressive queue processing loop
    const processQueue = () => {
      if (canceled) return;

      while (activeLoads < MAX_CONCURRENT_LOADS && loadQueue.length > 0) {
        const fIdx = loadQueue.shift();
        if (!fIdx || loadedMap.has(fIdx) || pendingLoads.has(fIdx)) continue;

        pendingLoads.add(fIdx);
        activeLoads++;

        loadFrameAsset(fIdx)
          .then((asset) => {
            if (canceled) {
              if (asset.bitmap) asset.bitmap.close();
              return;
            }
            loadedMap.set(fIdx, asset);
            if (fIdx === currentTargetFrame) {
              requestFrameDraw(fIdx);
            }
          })
          .catch(() => {})
          .finally(() => {
            pendingLoads.delete(fIdx);
            activeLoads--;
            processQueue();
          });
      }
    };

    // Populate queue: Priority 1 (frame 1), Priority 2 (2..30), Priority 3 (31..300)
    for (let i = 2; i <= PRIORITY_INITIAL_BATCH; i++) {
      loadQueue.push(i);
    }
    for (let i = PRIORITY_INITIAL_BATCH + 1; i <= FRAME_COUNT; i++) {
      loadQueue.push(i);
    }

    // Load Frame 1 immediately
    pendingLoads.add(1);
    loadFrameAsset(1).then((asset) => {
      if (canceled) {
        if (asset.bitmap) asset.bitmap.close();
        return;
      }
      loadedMap.set(1, asset);
      pendingLoads.delete(1);
      requestFrameDraw(1);
      processQueue();
    });

    // Handle viewport resize
    const handleResize = () => {
      updateDimensions();
      lastRenderedFrame = -1; // force redraw
      requestFrameDraw(currentTargetFrame);
    };

    window.addEventListener("resize", handleResize);

    // GSAP ScrollTrigger setup
    scrollTriggerInstance = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: () => `+=${window.innerHeight * 2.5}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onUpdate: (self) => {
        const prog = self.progress;
        setScrollProgress(prog);

        const targetFrame = clamp(Math.floor(prog * (FRAME_COUNT - 1)) + 1, 1, FRAME_COUNT);
        requestFrameDraw(targetFrame);
      }
    });

    return () => {
      canceled = true;
      window.removeEventListener("resize", handleResize);

      if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
      }

      if (renderAnimationFrameId) {
        cancelAnimationFrame(renderAnimationFrameId);
      }

      for (const asset of loadedMap.values()) {
        if (asset.bitmap) {
          asset.bitmap.close();
        }
      }
      loadedMap.clear();
      pendingLoads.clear();
    };
  }, []);

  // Compute smooth Opacities & Transforms for Editorial Typography Phases based on scroll progress (0.0 to 1.0)
  const getPhaseStyles = (start: number, peakStart: number, peakEnd: number, end: number) => {
    let opacity = 0;
    if (scrollProgress >= start && scrollProgress < peakStart) {
      opacity = (scrollProgress - start) / (peakStart - start);
    } else if (scrollProgress >= peakStart && scrollProgress <= peakEnd) {
      opacity = 1;
    } else if (scrollProgress > peakEnd && scrollProgress <= end) {
      opacity = 1 - (scrollProgress - peakEnd) / (end - peakEnd);
    }

    // Parallax y-shift and subtle scale
    const midPoint = (start + end) / 2;
    const progressDelta = scrollProgress - midPoint;
    const translateY = progressDelta * -80; // subtle float up as user scrolls
    const blur = (1 - opacity) * 8;

    return {
      opacity: Math.max(0, Math.min(1, opacity)),
      transform: `translate3d(0, ${translateY.toFixed(1)}px, 0)`,
      filter: `blur(${blur.toFixed(1)}px)`,
      pointerEvents: (opacity > 0.3 ? "auto" : "none") as "auto" | "none"
    };
  };

  const phase1Style = getPhaseStyles(0.0, 0.04, 0.18, 0.26);
  const phase2Style = getPhaseStyles(0.24, 0.32, 0.44, 0.52);
  const phase3Style = getPhaseStyles(0.50, 0.58, 0.70, 0.78);
  const phase4Style = getPhaseStyles(0.76, 0.84, 0.96, 1.0);

  return (
    <>
      <section ref={stageRef} className="hero-stage" aria-label="Cinematic Portfolio Hero">
        <div ref={viewportRef} className="hero-viewport">
          {/* Volumetric Backdrop Lighting */}
          <div className="hero-backdrop" aria-hidden="true" />

          {/* Editorial Typography (Layered Behind Subject/Canvas) */}
          <div className="hero-typography" aria-hidden="true">
            {/* Phase 1: Main Name & Primary Title */}
            <div className="hero-phase" style={phase1Style}>
              <span className="text-editorial-tag">HELLO.</span>
              <h1 className="text-editorial-title">{displayName}</h1>
              <p className="text-editorial-subtitle">{subtitle}</p>
            </div>

            {/* Phase 2: Full Stack & AI Focus */}
            <div className="hero-phase" style={phase2Style}>
              <span className="text-editorial-tag">BUILDING DIGITAL EXPERIENCES</span>
              <h2 className="text-porsche-hero">FULL STACK DEVELOPER</h2>
              <p className="text-editorial-subtitle">AI ENGINEER</p>
            </div>

            {/* Phase 3: Philosophy & Core Capabilities */}
            <div className="hero-phase" style={phase3Style}>
              <span className="text-editorial-tag">CRAFTING PRODUCTS THAT MATTER</span>
              <div className="hero-pills">
                <span className="hero-pill">DESIGN</span>
                <span className="hero-pill">BUILD</span>
                <span className="hero-pill">SHIP</span>
              </div>
            </div>

            {/* Phase 4: Availability & Conclusion */}
            <div className="hero-phase" style={phase4Style}>
              <span className="text-editorial-tag">{availabilityTag}</span>
              <h2 className="text-editorial-title">{displayName}</h2>
              <p className="text-editorial-subtitle">SOFTWARE & AI ENGINEER</p>
            </div>
          </div>

          {/* Fullscreen Interactive Canvas */}
          <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />

          {/* Vignette & Fine Film Grain Overlays */}
          <div className="hero-vignette" aria-hidden="true" />
          <div className="hero-grain" aria-hidden="true" />


        </div>
      </section>
    </>
  );
}
