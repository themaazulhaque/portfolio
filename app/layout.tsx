import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getPublicSettings, getPublicSocialLinks } from "../lib/cms";

const PRODUCTION_URL = "https://maazulhaque.qd.je";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const socialLinks = await getPublicSocialLinks();

  const name = settings.name || "Maazul Haque";
  const title = settings.seoTitle || `${name} — Full-Stack & Mobile App Developer`;
  const description =
    settings.seoDescription ||
    `${name} is a full-stack software engineer specializing in React, Next.js, React Native, Django, and Python. View projects, experience, and get in touch.`;

  const ogImage = settings.ogImageUrl || `${PRODUCTION_URL}/uploads/6561a428-d918-4e1a-bfbb-faebbf7e10cb.png`;

  const sameAs = socialLinks
    .filter((link) => link.visible && link.url)
    .map((link) => link.url);

  return {
    title,
    description,
    metadataBase: new URL(PRODUCTION_URL),
    alternates: {
      canonical: PRODUCTION_URL,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: PRODUCTION_URL,
      siteName: name,
      locale: "en_US",
      type: "website",
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: `${name} — Software Engineer Portfolio`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(sameAs.length > 0 ? { other: { "contact-info": settings.email } } : {}),
  };
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const settings = await getPublicSettings();

  const name = settings.name || "Maazul Haque";
  const sameAs = (await getPublicSocialLinks())
    .filter((link) => link.visible && link.url)
    .map((link) => link.url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: PRODUCTION_URL,
    image: settings.aboutPortrait || undefined,
    jobTitle: settings.title || "Software Engineer",
    description:
      settings.seoDescription ||
      `${name} is a full-stack software engineer specializing in React, Next.js, React Native, Django, and Python.`,
    email: settings.email,
    address: settings.location
      ? {
          "@type": "PostalAddress",
          addressLocality: settings.location.split("·")[0]?.trim(),
          addressCountry: "IN",
        }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    knowsAbout: [
      "React",
      "Next.js",
      "React Native",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "Django",
      "Python",
      "Full-Stack Development",
      "Mobile App Development",
      "Web Development",
    ],
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {settings.faviconUrl ? (
          <link rel="icon" href={settings.faviconUrl} />
        ) : (
          <link rel="icon" href="/favicon.ico" sizes="any" />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Cinzel:wght@400..700&family=Caveat:wght@400..700&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#060608" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
