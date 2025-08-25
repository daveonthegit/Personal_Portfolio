import Link from 'next/link'
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react'

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/yourusername',
    icon: Github,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/yourusername',
    icon: Linkedin,
  },
  {
    name: 'Email',
    href: 'mailto:your.email@example.com',
    icon: Mail,
  },
]

const footerLinks = [
  {
    title: 'Portfolio',
    links: [
      { name: 'Projects', href: '/projects' },
      { name: '3D Models', href: '/models' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Resume', href: '/resume.pdf' },
      { name: 'Blog', href: '/blog' },
      { name: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand and description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Developer Portfolio
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              Full-stack developer creating interactive experiences with modern web technologies and 3D graphics.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <span className="sr-only">{item.name}</span>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        target={link.href.endsWith('.pdf') ? '_blank' : undefined}
                        rel={link.href.endsWith('.pdf') ? 'noopener noreferrer' : undefined}
                        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        {link.name}
                        {(link.href.endsWith('.pdf') || link.href.endsWith('.xml')) && (
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Developer Portfolio. Built with Next.js, TypeScript, and ❤️
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Optimized for performance and accessibility
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
