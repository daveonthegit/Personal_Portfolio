import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Developer Portfolio',
    default: 'Developer Portfolio',
  },
  description: 'A full-stack developer portfolio showcasing interactive 3D models, case studies, and development projects.',
  keywords: ['developer', 'portfolio', '3D', 'React', 'Next.js', 'TypeScript'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  metadataBase: new URL('https://your-domain.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'Developer Portfolio',
    title: 'Developer Portfolio',
    description: 'A full-stack developer portfolio showcasing interactive 3D models, case studies, and development projects.',
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
    card: 'summary_large_image',
    title: 'Developer Portfolio',
    description: 'A full-stack developer portfolio showcasing interactive 3D models, case studies, and development projects.',
    creator: '@yourusername',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-white`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <Header />
        
        <main id="main-content" className="flex-1">
          {children}
        </main>
        
        <Footer />

        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        )}
      </body>
    </html>
  )
}
