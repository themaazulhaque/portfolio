import { ImageSequenceHero } from "../components/hero/image-sequence-hero";
import { SiteNav } from "../components/site-nav";
import { AboutSection } from "../components/about";
import { ProjectsSection } from "../components/projects";
import { ExperienceSection } from "../components/experience";
import { StackSection } from "../components/stack";
import { ServicesSection } from "../components/services";
import { ReviewsSection } from "../components/reviews";
import { ContactSection } from "../components/contact";
import { FooterSection } from "../components/footer";
import {
  getPublicSettings,
  getPublicSocialLinks,
  getPublicProjects,
  getPublicExperiences,
  getPublicServices,
  getPublicTech,
  getPublicReviews
} from "../lib/cms";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [settings, socialLinks, projects, experiences, services, tech, reviews] = await Promise.all([
    getPublicSettings(),
    getPublicSocialLinks(),
    getPublicProjects(),
    getPublicExperiences(),
    getPublicServices(),
    getPublicTech(),
    getPublicReviews()
  ]);

  return (
    <>
      <SiteNav name={settings.name} email={settings.email} availability={settings.availability} />
      <main>
        {/* Existing cinematic Hero — untouched. Sections begin below it. */}
        <ImageSequenceHero name={settings.name} title={settings.title} availability={settings.availability} />
        <AboutSection
          name={settings.name}
          location={settings.location}
          availability={settings.availability}
          portrait={settings.aboutPortrait}
        />
        <ProjectsSection projects={projects} />
        <ExperienceSection experiences={experiences} />
        <StackSection tech={tech} />
        <ServicesSection services={services} />
        <ReviewsSection reviews={reviews} />
        <ContactSection settings={settings} socialLinks={socialLinks} />
      </main>
      <FooterSection settings={settings} socialLinks={socialLinks} />
    </>
  );
}
