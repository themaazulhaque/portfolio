import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getPublicSettings } from "../lib/cms";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const name = settings.name || "Maazul Haque";
  const title = settings.seoTitle || name;
  const description =
    settings.seoDescription || "A luxury editorial developer portfolio hero built with Next.js, GSAP, and Canvas.";

  return {
    title,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
      title,
      description,
      ...(settings.ogImageUrl ? { images: [settings.ogImageUrl] } : {})
    }
  };
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const settings = await getPublicSettings();

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
      </head>
      <body>{children}</body>
    </html>
  );
}
