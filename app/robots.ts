import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/health', '/_next'],
      },
    ],
    sitemap: 'https://maazulhaque.qd.je/sitemap.xml',
  };
}
