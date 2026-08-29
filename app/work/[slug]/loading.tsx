export default function Loading() {
  return (
    <div className="case-study-page">
      <header className="cs-topbar">
        <div className="container cs-topbar-inner">
          <div className="cs-back-link" style={{ opacity: 0.45 }}>
            &larr; Back to Work
          </div>
          <div className="cs-topbar-right">
            <span className="kicker-num">--</span>
            <span className="cs-topbar-cat">Loading</span>
          </div>
        </div>
      </header>

      <section className="cs-intro">
        <div className="container">
          <div className="cs-intro-label">
            <span className="kicker">
              <span className="kicker-num">--</span> Case Study
            </span>
          </div>
          <div className="case-skeleton case-skeleton--title" />
          <div className="case-skeleton case-skeleton--subtitle" />
          <div className="case-skeleton-meta">
            <div className="case-skeleton case-skeleton--meta-item" />
            <div className="case-skeleton case-skeleton--meta-item" />
            <div className="case-skeleton case-skeleton--meta-item" />
          </div>
        </div>
      </section>
    </div>
  );
}
