import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { getPublicSettings } from "../lib/cms";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Page Not Found — Maazul Haque",
  description: "The page you're looking for doesn't exist. Return to Maazul Haque's portfolio.",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const settings = await getPublicSettings();

  return (
    <>
      <SiteNav name={settings.name} email={settings.email} availability={settings.availability} />
      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "6rem", fontWeight: 200, lineHeight: 1, margin: 0, opacity: 0.3 }}>404</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 400, margin: "1rem 0" }}>Page not found</h1>
          <p style={{ opacity: 0.6, marginBottom: "2rem" }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "2rem",
              textDecoration: "none",
              color: "inherit",
              fontSize: "0.9rem",
            }}
          >
            ← Back to portfolio
          </Link>
        </div>
      </main>
    </>
  );
}
