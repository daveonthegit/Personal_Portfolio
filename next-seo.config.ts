import { DefaultSeoProps } from 'next-seo'

const config: DefaultSeoProps = {
  titleTemplate: '%s | Developer Portfolio',
  defaultTitle: 'Developer Portfolio',
  description: 'A full-stack developer portfolio showcasing interactive 3D models, case studies, and development projects.',
  canonical: 'https://your-domain.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'Developer Portfolio',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Developer Portfolio',
      },
    ],
  },
  twitter: {
    handle: '@yourusername',
    site: '@yourusername',
    cardType: 'summary_large_image',
  },
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
  ],
}

export default config
