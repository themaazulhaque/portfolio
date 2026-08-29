import Link from "next/link";
import { SiteNav } from "../../../components/site-nav";
import { buildCaseStudyLinks } from "../../../lib/sanitize";
import type { PublicProject, PublicSettings } from "../../../lib/types";

interface CaseStudyContentProps {
  project: PublicProject;
  prevProject: PublicProject | null;
  nextProject: PublicProject | null;
  settings: PublicSettings;
}

function hasText(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}


export default function CaseStudyContent({
  project,
  prevProject,
  nextProject,
  settings,
}: CaseStudyContentProps) {
  const overview = (project.overview ?? []).filter(hasText);
  const challenge = (project.challenge ?? []).filter(hasText);
  const solution = (project.solution ?? []).filter(hasText);
  const process = (project.process ?? []).filter(
    (step) => step && hasText(step.step) && hasText(step.title) && hasText(step.desc)
  );
  const gallery = (project.gallery ?? []).filter(hasText);
  const results = (project.results ?? []).filter(
    (result) => result && hasText(result.metric) && hasText(result.label)
  );
  const techStack = (project.techStack ?? []).filter(hasText);
  const docLinks = buildCaseStudyLinks({
    liveUrl: project.liveUrl,
    githubUrl: project.githubUrl,
    repository: project.repository,
    documentationUrl: project.documentationUrl,
    figmaUrl: project.figmaUrl,
    casePdfUrl: project.casePdfUrl,
    additionalLinks: (project.additionalLinks ?? []).map((link) => ({
      label: link?.label,
      url: link?.url,
    })),
  });

  const hasNav = Boolean(prevProject || nextProject);
  const navCount = [prevProject, nextProject].filter(Boolean).length;

  const sections: { id: string; label: string }[] = [];
  if (overview.length > 0) sections.push({ id: "cs-overview", label: "Overview" });
  if (challenge.length > 0) sections.push({ id: "cs-challenge", label: "Challenge" });
  if (solution.length > 0) sections.push({ id: "cs-solution", label: "Solution" });
  if (process.length > 0) sections.push({ id: "cs-process", label: "Process" });
  if (results.length > 0) sections.push({ id: "cs-results", label: "Results" });
  if (techStack.length > 0) sections.push({ id: "cs-tech", label: "Technology" });
  if (docLinks.length > 0) sections.push({ id: "cs-resources", label: "Resources" });
  if (gallery.length > 0) sections.push({ id: "cs-gallery", label: "Gallery" });

  return (
    <>
      <SiteNav name={settings.name} email={settings.email} availability={settings.availability} />

      <header className="cs-topbar">
        <div className="container cs-topbar-inner">
          <Link href="/#projects" className="cs-back-link">
            <span aria-hidden="true">←</span>
            <span>Back to Work</span>
          </Link>
          <div className="cs-topbar-right">
            <span className="kicker-num">{project.num}</span>
            <span className="cs-topbar-cat">{project.cat}</span>
          </div>
        </div>
      </header>

      <section className="cs-intro">
        <div className="container">
          <div className="cs-intro-label" data-case-reveal>
            <span className="kicker">
              <span className="kicker-num">{project.num}</span> Case Study
            </span>
          </div>

          <h1 className="cs-intro-title" data-reveal>{project.title}</h1>

          {hasText(project.subtitle) && (
            <p className="cs-intro-subtitle" data-case-reveal>{project.subtitle}</p>
          )}

          <div className="cs-meta-row" data-case-reveal>
            {hasText(project.year) && (
              <div className="cs-meta-item">
                <span className="cs-meta-label">Year</span>
                <span className="cs-meta-value">{project.year}</span>
              </div>
            )}
            {hasText(project.client) && (
              <div className="cs-meta-item">
                <span className="cs-meta-label">Client</span>
                <span className="cs-meta-value">{project.client}</span>
              </div>
            )}
            {hasText(project.role) && (
              <div className="cs-meta-item">
                <span className="cs-meta-label">Role</span>
                <span className="cs-meta-value">{project.role}</span>
              </div>
            )}
            {hasText(project.stack) && (
              <div className="cs-meta-item">
                <span className="cs-meta-label">Stack</span>
                <span className="cs-meta-value">{project.stack}</span>
              </div>
            )}
          </div>

          <div className="cs-actions" data-case-reveal>
            {hasText(project.liveUrl) && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cs-action cs-action--primary"
              >
                Visit Live Website
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {hasText(project.githubUrl) && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cs-action cs-action--secondary"
              >
                GitHub
              </a>
            )}
            {hasText(project.casePdfUrl) && (
              <a
                href={project.casePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cs-action cs-action--secondary"
              >
                Case Study PDF
              </a>
            )}
          </div>
        </div>
      </section>

      {sections.length > 1 && (
        <nav className="cs-section-nav" aria-label="Case study sections">
          <div className="container">
            <div className="cs-section-nav-inner">
              {sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="cs-section-nav-link">
                  <span className="cs-section-nav-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cs-section-nav-label">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      <div className="cs-body">
        {overview.length > 0 && (
          <section id="cs-overview" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">01</span> Overview
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-prose">
                {overview.map((paragraph, i) => (
                  <p key={`${i}-${paragraph}`} className="cs-body-text" data-case-reveal>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {challenge.length > 0 && (
          <section id="cs-challenge" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">02</span> Challenge
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-prose cs-prose--constrained">
                {challenge.map((item, idx) => (
                  <div key={`${idx}-${item}`} className="cs-list-item" data-case-reveal>
                    <span className="cs-list-marker" aria-hidden="true" />
                    <p className="cs-body-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {solution.length > 0 && (
          <section id="cs-solution" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">03</span> Solution
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-prose cs-prose--constrained">
                {solution.map((item, idx) => (
                  <div key={`${idx}-${item}`} className="cs-list-item cs-list-item--accent" data-case-reveal>
                    <span className="cs-list-marker cs-list-marker--accent" aria-hidden="true" />
                    <p className="cs-body-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {process.length > 0 && (
          <section id="cs-process" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">04</span> Process
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-process-timeline">
                {process.map((item, idx) => (
                  <div key={item.step} className="cs-process-entry" data-case-reveal>
                    <div className="cs-process-num">{item.step}</div>
                    <div className="cs-process-content">
                      <h3 className="cs-process-title">{item.title}</h3>
                      <p className="cs-process-desc">{item.desc}</p>
                    </div>
                    {idx < process.length - 1 && <span className="cs-process-line" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section id="cs-results" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">05</span> Results
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-results-row">
                {results.map((res) => (
                  <div key={`${res.metric}-${res.label}`} className="cs-result" data-case-reveal>
                    <span className="cs-result-metric">{res.metric}</span>
                    <span className="cs-result-label">{res.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {techStack.length > 0 && (
          <section id="cs-tech" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">06</span> Technology
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-tech-tags" data-case-reveal>
                {techStack.map((tech) => (
                  <span key={tech} className="cs-tech-tag">{tech}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {docLinks.length > 0 && (
          <section id="cs-resources" className="cs-section">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">07</span> Resources
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-links-list">
                {docLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cs-link-row"
                    data-case-reveal
                  >
                    <span className="cs-link-label">{link.label}</span>
                    <span className="cs-link-arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section id="cs-gallery" className="cs-section cs-section--gallery">
            <div className="container">
              <div className="cs-section-head" data-case-reveal>
                <p className="kicker">
                  <span className="kicker-num">
                    {String(
                      sections.findIndex((s) => s.id === "cs-gallery") + 1
                    ).padStart(2, "0")}
                  </span>{" "}
                  Gallery
                </p>
                <span className="cs-section-rule" aria-hidden="true" />
              </div>
              <div className="cs-gallery-grid">
                {gallery.map((imgUrl, index) => (
                  <figure key={`${index}-${imgUrl}`} className="cs-gallery-item" data-case-reveal>
                    <img
                      src={imgUrl}
                      alt={`${project.title} gallery image ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="cs-gallery-shade" aria-hidden="true" />
                    <figcaption className="cs-gallery-caption">
                      {String(index + 1).padStart(2, "0")}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {hasNav && (
        <section className="cs-nav-section">
          <div className="container">
            <div className={`cs-nav-grid${navCount === 1 ? " cs-nav-grid--single" : ""}`}>
              {prevProject && (
                <Link
                  href={`/work/${prevProject.slug}`}
                  className="cs-nav-card cs-nav-card--prev"
                  data-case-reveal
                >
                  <span className="cs-nav-arrow" aria-hidden="true">←</span>
                  <div className="cs-nav-info">
                    <span className="cs-nav-label">Previous</span>
                    <span className="cs-nav-title">{prevProject.title}</span>
                    {hasText(prevProject.cat) && (
                      <span className="cs-nav-cat">{prevProject.cat}</span>
                    )}
                  </div>
                </Link>
              )}
              {nextProject && (
                <Link
                  href={`/work/${nextProject.slug}`}
                  className="cs-nav-card cs-nav-card--next"
                  data-case-reveal
                >
                  <div className="cs-nav-info cs-nav-info--end">
                    <span className="cs-nav-label">Next</span>
                    <span className="cs-nav-title">{nextProject.title}</span>
                    {hasText(nextProject.cat) && (
                      <span className="cs-nav-cat">{nextProject.cat}</span>
                    )}
                  </div>
                  <span className="cs-nav-arrow" aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="case-footer">
        <div className="container case-footer-inner">
          <span>Copyright {new Date().getFullYear()} {settings.name || "Maazul Haque"}</span>
          <Link href="/#projects" className="case-back-top">
            Back to Portfolio
          </Link>
        </div>
      </footer>
    </>
  );
}
