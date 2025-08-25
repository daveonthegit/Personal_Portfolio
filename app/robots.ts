import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/_next/',
        '/assets/models/*.glb', // Prevent crawling of large 3D model files
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
