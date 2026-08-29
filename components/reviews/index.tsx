"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { revealClip } from "../../lib/reveal";
import type { PublicReview } from "../../lib/types";

interface ReviewsSectionProps {
  reviews: PublicReview[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      section.querySelectorAll<HTMLElement>(".review-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none none",
            },
            delay: i * 0.1,
          }
        );
      });
      revealClip(section);
    }, section);

    return () => ctx.revert();
  }, [reviews]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

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
      const data = await res.json() as { url?: string; error?: string };
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

        {reviews.length > 0 ? (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review._id}>
                <div className="review-stars" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="review-star">★</span>
                  ))}
                </div>
                <blockquote className="review-quote">
                  &ldquo;{review.review}&rdquo;
                </blockquote>
                <div className="review-author">
                  {review.image ? (
                    <div className="review-avatar">
                      <img src={review.image} alt={review.name} loading="lazy" />
                    </div>
                  ) : (
                    <div className="review-avatar review-avatar--fallback">
                      {getInitials(review.name)}
                    </div>
                  )}
                  <div className="review-author-info">
                    <span className="review-name">{review.name}</span>
                    {review.designation && (
                      <span className="review-designation">{review.designation}</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="review-empty">
            <p className="review-empty-text">
              Be the first to leave a review.
            </p>
          </div>
        )}

        <div className="reviews-action">
          {!showForm ? (
            <button
              type="button"
              className="review-toggle-btn"
              onClick={() => setShowForm(true)}
            >
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
                    onClick={() => { setShowForm(false); setSubmitted(false); }}
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
                          <span className="review-photo-placeholder" aria-hidden="true">↑</span>
                        )}
                        {photoUploading && <span className="review-photo-uploading" aria-label="Uploading">…</span>}
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
                    <button
                      type="submit"
                      className="send-btn"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : "Submit Review"}
                    </button>
                    <button
                      type="button"
                      className="review-cancel-btn"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
