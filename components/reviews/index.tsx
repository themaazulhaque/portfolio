"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicReview } from "../../lib/types";

interface ReviewsSectionProps {
  reviews: PublicReview[];
  testimonialVideo?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Coverflow constants ── */
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 240;
const TRANSITION_DUR = 0.6;
const LOCK_MS = Math.max(50, TRANSITION_DUR * 1000);
const CARD_W = 380;
const CARD_H = 420;
const TILT = 3;
const SIDE_TILT = 23;
const GAP = 4;
const OPACITY_DIM = 0.61;

export function ReviewsSection({ reviews, testimonialVideo }: ReviewsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ── Carousel state ── */
  const [active, setActive] = useState(0);
  const lockRef = useRef(false);
  const n = reviews.length;

  /* ── Video state ── */
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* ── Form state (preserved from original) ── */
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    designation: "",
    review: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── Scroll-triggered reveal ── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  /* ── Video autoplay retry ── */
  useEffect(() => {
    if (!testimonialVideo || !videoRef.current) return;
    const vid = videoRef.current;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        vid.muted = true;
        vid.play().catch(() => setVideoError(true));
      });
    }
  }, [testimonialVideo]);

  /* ── Carousel lock ── */
  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, LOCK_MS);
  }, []);

  /* ── Carousel navigation ── */
  const step = useCallback(
    (dir: number) => {
      if (lockRef.current || n < 2) return;
      lock();
      setActive((a) => (((a + dir) % n) + n) % n);
    },
    [n, lock]
  );

  const handleCardClick = useCallback(
    (i: number) => {
      if (lockRef.current || n < 2) return;
      lock();
      setActive((a) => (i === a ? (a + 1) % n : i));
    },
    [n, lock]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    },
    [step]
  );

  /* ── Autoplay (pauses on hover/focus per WCAG 2.2.2) ── */
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (n < 2 || paused) return;
    const id = window.setInterval(() => step(-1), 2500);
    return () => window.clearInterval(id);
  }, [n, step, paused]);

  /* ── Photo upload (preserved) ── */
  const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

  const handlePhotoSelect = async (file: File) => {
    setPhotoError("");
    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      setPhotoError("Only JPG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Image must be under 10 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/reviews/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setPhotoUrl(data.url);
      } else {
        setPhotoError(data.error || "Upload failed.");
        setPhotoFile(null);
        setPhotoPreview("");
      }
    } catch {
      setPhotoError("Upload failed.");
      setPhotoFile(null);
      setPhotoPreview("");
    }
    setPhotoUploading(false);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoUrl("");
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formState.name.trim() || !formState.email.trim() || !formState.review.trim()) {
      setFormError("Name, email, and review are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (formState.review.trim().length < 10) {
      setFormError("Review must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name.trim(),
          email: formState.email.trim(),
          designation: formState.designation.trim() || undefined,
          review: formState.review.trim(),
          image: photoUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setFormState({ name: "", email: "", designation: "", review: "" });
        removePhoto();
      } else {
        setFormError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setFormError("Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  const hasVideo = Boolean(testimonialVideo);

  /* ── Empty state ── */
  if (n === 0 && !hasVideo) {
    return (
      <section className="section reviews" id="reviews" ref={sectionRef} aria-label="Client Reviews">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">
                <span className="kicker-num">07</span> Client Reviews
              </p>
              <h2 className="masthead" data-reveal>
                What Clients Say
              </h2>
            </div>
          </div>
          <div className="review-empty">
            <p className="review-empty-text">Be the first to leave a review.</p>
          </div>
          <ReviewsAction
            showForm={showForm}
            setShowForm={setShowForm}
            submitted={submitted}
            setSubmitted={setSubmitted}
            formState={formState}
            setFormState={setFormState}
            formError={formError}
            submitting={submitting}
            handleSubmit={handleSubmit}
            photoPreview={photoPreview}
            photoUploading={photoUploading}
            photoError={photoError}
            fileInputRef={fileInputRef}
            handlePhotoSelect={handlePhotoSelect}
            removePhoto={removePhoto}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="section reviews" id="reviews" ref={sectionRef} aria-label="Client Reviews">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="kicker">
              <span className="kicker-num">07</span> Client Reviews
            </p>
            <h2 className="masthead" data-reveal>
              What Clients Say
            </h2>
          </div>
        </div>

        <div className="reviews-split">
          {/* ── Left Column: Video ── */}
          <div className="reviews-split__video-col">
            {hasVideo ? (
              <div className="reviews-video-container">
                {!videoLoaded && !videoError && (
                  <div className="reviews-video-placeholder" aria-hidden="true">
                    <div className="reviews-video-spinner" />
                    <span className="reviews-video-placeholder-text">Loading video</span>
                  </div>
                )}
                {videoError && (
                  <div className="reviews-video-placeholder reviews-video-placeholder--error">
                    <span className="reviews-video-placeholder-text">Video unavailable</span>
                  </div>
                )}
                <video
                  ref={videoRef}
                  className={`reviews-video${videoLoaded ? " is-loaded" : ""}`}
                  src={testimonialVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onLoadedData={() => setVideoLoaded(true)}
                  onError={() => setVideoError(true)}
                  aria-label="Testimonial showcase video"
                />
              </div>
            ) : (
              <div className="reviews-video-container">
                <div className="reviews-video-placeholder">
                  <span className="reviews-video-placeholder-text">
                    Upload a testimonial video from the Admin Panel
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Carousel ── */}
          <div className="reviews-split__carousel-col">
            {n > 0 ? (
              <div
                className="review-carousel"
                tabIndex={0}
                role="group"
                aria-roledescription="carousel"
                onKeyDown={onKeyDown}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
              >
                <div className="review-carousel__stage" aria-live="polite" aria-atomic="false">
                  {reviews.map((review, i) => {
                    let rel = i - active;
                    if (rel > n / 2) rel -= n;
                    if (rel < -n / 2) rel += n;

                    const ax = Math.abs(rel);
                    const visible = ax <= MAX_VISIBLE;
                    const isActive = rel === 0;
                    const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
                    const tx = rel * (GAP * 30);
                    const tz = -ax * DEPTH;
                    const ry = -rel * TILT;
                    const rz = rel * SIDE_TILT;

                    return (
                      <div
                        key={review._id}
                        className="review-carousel__card"
                        onClick={() => handleCardClick(i)}
                        aria-label={`${review.name} — review`}
                        aria-hidden={!visible}
                        style={{
                          width: CARD_W,
                          height: CARD_H,
                          transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
                          opacity: visible ? 1 : 0,
                          pointerEvents: visible ? "auto" : "none",
                          cursor: isActive ? "default" : "pointer",
                        }}
                      >
                        <div className="review-carousel__avatar">
                          {review.image ? (
                            <img src={review.image} alt="" draggable={false} />
                          ) : (
                            <span className="review-carousel__initials">{getInitials(review.name)}</span>
                          )}
                        </div>
                        <div className="review-carousel__gradient" />
                        <div className="review-carousel__content">
                          <div className="review-carousel__stars" aria-label="5 out of 5 stars">
                            {[...Array(5)].map((_, si) => (
                              <span key={si}>★</span>
                            ))}
                          </div>
                          <blockquote className="review-carousel__quote">
                            &ldquo;{review.review}&rdquo;
                          </blockquote>
                          <div className="review-carousel__author">
                            <span className="review-carousel__name">{review.name}</span>
                            {review.designation && (
                              <span className="review-carousel__designation">{review.designation}</span>
                            )}
                          </div>
                        </div>
                        <div
                          className="review-carousel__dim"
                          style={{ opacity: isActive ? 0 : 1 - OPACITY_DIM }}
                        />
                      </div>
                    );
                  })}
                </div>

                {n > 1 && (
                  <>
                    <button
                      type="button"
                      className="review-carousel__arrow review-carousel__arrow--left"
                      onClick={() => step(1)}
                      aria-label="Previous review"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="review-carousel__arrow review-carousel__arrow--right"
                      onClick={() => step(-1)}
                      aria-label="Next review"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="review-empty">
                <p className="review-empty-text">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>

        <ReviewsAction
          showForm={showForm}
          setShowForm={setShowForm}
          submitted={submitted}
          setSubmitted={setSubmitted}
          formState={formState}
          setFormState={setFormState}
          formError={formError}
          submitting={submitting}
          handleSubmit={handleSubmit}
          photoFile={photoFile}
          photoPreview={photoPreview}
          photoUploading={photoUploading}
          photoError={photoError}
          fileInputRef={fileInputRef}
          handlePhotoSelect={handlePhotoSelect}
          removePhoto={removePhoto}
        />
      </div>
    </section>
  );
}

/* ── Extracted form action (preserved exactly from original) ── */
function ReviewsAction({
  showForm,
  setShowForm,
  submitted,
  setSubmitted,
  formState,
  setFormState,
  formError,
  submitting,
  handleSubmit,
  photoPreview,
  photoUploading,
  photoError,
  fileInputRef,
  handlePhotoSelect,
  removePhoto,
}: {
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
  formState: { name: string; email: string; designation: string; review: string };
  setFormState: (v: { name: string; email: string; designation: string; review: string }) => void;
  formError: string;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  photoFile: File | null;
  photoPreview: string;
  photoUploading: boolean;
  photoError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoSelect: (file: File) => Promise<void>;
  removePhoto: () => void;
}) {
  return (
    <div className="reviews-action">
      {!showForm ? (
        <button type="button" className="review-toggle-btn" onClick={() => setShowForm(true)}>
          Leave a Review
        </button>
      ) : (
        <div className="review-form-wrap">
          {submitted ? (
            <div className="review-success">
              <p>Thank you! Your review has been submitted and will appear after approval.</p>
              <button
                type="button"
                className="review-toggle-btn"
                onClick={() => {
                  setShowForm(false);
                  setSubmitted(false);
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form className="review-form" onSubmit={handleSubmit}>
              <h3 className="review-form-title">Share Your Experience</h3>
              <div className="review-form-grid">
                <div className="field">
                  <label htmlFor="review-name">Name *</label>
                  <input
                    id="review-name"
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="review-email">Email *</label>
                  <input
                    id="review-email"
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="review-designation">Designation</label>
                <input
                  id="review-designation"
                  type="text"
                  value={formState.designation}
                  onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
                  placeholder="Optional — e.g. Owner, CEO"
                />
              </div>
              <div className="field">
                <label htmlFor="review-text">Review *</label>
                <textarea
                  id="review-text"
                  value={formState.review}
                  onChange={(e) => setFormState({ ...formState, review: e.target.value })}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  required
                />
              </div>
              <div className="review-photo-field">
                <label>Profile Photo</label>
                <p className="review-photo-hint">Optional — JPG, PNG, or WebP, max 10 MB</p>
                <div className="review-photo-row">
                  <div className="review-photo-preview">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" />
                    ) : (
                      <span className="review-photo-placeholder" aria-hidden="true">
                        ↑
                      </span>
                    )}
                    {photoUploading && (
                      <span className="review-photo-uploading" aria-label="Uploading">
                        …
                      </span>
                    )}
                  </div>
                  <div className="review-photo-actions">
                    <button
                      type="button"
                      className="review-photo-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {photoFile ? "Replace Photo" : "Upload Photo"}
                    </button>
                    {photoFile && (
                      <button
                        type="button"
                        className="review-photo-btn review-photo-btn--remove"
                        onClick={removePhoto}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {photoError && <p className="review-photo-error">{photoError}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelect(file);
                    e.target.value = "";
                  }}
                />
              </div>
              {formError && <div className="review-form-error">{formError}</div>}
              <div className="review-form-actions">
                <button type="submit" className="send-btn" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
                <button type="button" className="review-cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
