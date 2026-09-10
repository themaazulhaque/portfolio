import { notFound } from "next/navigation";
import { getPublicProjectContext, getPublicSettings } from "../../../lib/cms";
import CaseStudyClient from "./case-study-client";
import CaseStudyContent from "./case-study-content";

export const dynamic = "force-dynamic";

const PRODUCTION_URL = "https://maazulhaque.qd.je";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { project } = await getPublicProjectContext(slug);

  if (!project) return { title: "Project Not Found" };

  const title = `${project.title} — Case Study | Maazul Haque`;
  const description = project.subtitle || project.desc;
  const url = `${PRODUCTION_URL}/work/${project.slug}`;
  const image = project.coverImage || project.image || undefined;

  return {
    title,
    description,
    metadataBase: new URL(PRODUCTION_URL),
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Maazul Haque",
      locale: "en_US",
      type: "article",
      ...(image
        ? {
            images: [
              {
                url: image,
                width: 1200,
                height: 630,
                alt: `${project.title} — ${project.subtitle || "Case Study"}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [{ project, prev, next }, settings] = await Promise.all([
    getPublicProjectContext(slug),
    getPublicSettings(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <CaseStudyClient>
      <CaseStudyContent
        project={project}
        prevProject={prev}
        nextProject={next}
        settings={settings}
      />
    </CaseStudyClient>
  );
}
