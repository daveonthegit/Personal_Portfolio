import { MetadataRoute } from 'next'
// Temporary: commenting out contentlayer import to fix build
// import { allProjects } from 'contentlayer/generated'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/projects',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Project pages - temporary static list
  const projectPages = [
    {
      url: `${baseUrl}/projects/sample-project`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/projects/sample-project-2`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  ]

  // Model pages
  const modelSlugs = ['sample-chair', 'architectural-scene', 'product-showcase'] // Add your model slugs here
  const modelPages = modelSlugs.map((slug) => ({
    url: `${baseUrl}/models/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...projectPages, ...modelPages]
}
