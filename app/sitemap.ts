import type { MetadataRoute } from 'next';
import { getPublicProjects } from '../lib/cms';

const PRODUCTION_URL = 'https://maazulhaque.qd.je';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjects();

  const projectEntries: MetadataRoute.Sitemap[] = projects
    .filter((p) => p.slug)
    .map((project) => ({
      url: `${PRODUCTION_URL}/work/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [
    {
      url: PRODUCTION_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...projectEntries,
  ];
}
