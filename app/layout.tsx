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

  const name = settings.name || "Maazul Haque";
  const title = settings.seoTitle || `${name} — Software Developer & Full-Stack Engineer | React, Next.js, Node.js`;
  const description =
    settings.seoDescription ||
    `${name} is a software developer and full-stack engineer based in Delhi, India. Specializing in React, Next.js, React Native, Node.js, and Python. View projects, case studies, and experience.`;

  const ogImage = settings.ogImageUrl || `${PRODUCTION_URL}/favicon.svg`;

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
    ...(settings.email ? { other: { "contact-info": settings.email } } : {}),
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

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      url: PRODUCTION_URL,
      image: settings.aboutPortrait || undefined,
      jobTitle: settings.title || "Software Engineer",
      description:
        settings.seoDescription ||
        `${name} is a software developer and full-stack engineer based in Delhi, India. Specializing in React, Next.js, React Native, Node.js, Python, and AI-powered products. Eight years of experience building web and mobile applications.`,
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
        "MongoDB",
        "PostgreSQL",
        "Full-Stack Development",
        "Mobile App Development",
        "Web Development",
        "Software Engineering",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: `${name} — Portfolio`,
      url: PRODUCTION_URL,
      description:
        settings.seoDescription ||
        `${name}'s software engineering portfolio — showcasing web and mobile app projects, case studies, and professional experience in React, Next.js, and full-stack development.`,
      author: {
        "@type": "Person",
        name,
        url: PRODUCTION_URL,
      },
    },
  ];

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {settings.faviconUrl ? (
          <link rel="icon" href={settings.faviconUrl} />
        ) : (
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Cinzel:wght@400..700&family=Caveat:wght@400..700&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" href="https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYrvDE5ZdqU.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href={settings.faviconUrl || "/favicon.svg"} />
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
