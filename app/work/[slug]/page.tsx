import { notFound } from "next/navigation";
import { getPublicProjectContext, getPublicSettings } from "../../../lib/cms";
import CaseStudyClient from "./case-study-client";
import CaseStudyContent from "./case-study-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { project } = await getPublicProjectContext(slug);

  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} - Case Study | Maazul Haque`,
    description: project.subtitle,
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
