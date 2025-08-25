'use client'

import { useMDXComponent } from 'next-contentlayer/hooks'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ExternalLink, Github, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

// Dynamically import heavy components
const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Loading video...</div>
    </div>
  ),
})

const ModelViewer = dynamic(() => import('./ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Loading 3D model...</div>
    </div>
  ),
})

// Custom components for MDX
const components = {
  // Enhanced image component
  img: ({ src, alt, ...props }: any) => (
    <div className="relative my-8">
      <Image
        src={src}
        alt={alt || ''}
        width={800}
        height={400}
        className="rounded-lg shadow-sm"
        style={{ width: '100%', height: 'auto' }}
        {...props}
      />
      {alt && (
        <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 italic">
          {alt}
        </figcaption>
      )}
    </div>
  ),

  // Enhanced link component
  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http')
    const isGithub = href?.includes('github.com')
    
    return (
      <Link
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
        {...props}
      >
        {children}
        {isGithub && <Github className="h-3 w-3" />}
        {isExternal && !isGithub && <ExternalLink className="h-3 w-3" />}
      </Link>
    )
  },

  // Code blocks
  pre: ({ children, ...props }: any) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm" {...props}>
      {children}
    </pre>
  ),

  code: ({ children, ...props }: any) => (
    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-6 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg" {...props}>
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700" {...props}>
        {children}
      </table>
    </div>
  ),

  th: ({ children, ...props }: any) => (
    <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left font-medium" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }: any) => (
    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2" {...props}>
      {children}
    </td>
  ),

  // Custom callout components
  Callout: ({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'error' | 'success'; title?: string; children: React.ReactNode }) => {
    const config = {
      info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' },
      warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
      error: { icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200' },
      success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
    }
    
    const { icon: Icon, bg, border, text } = config[type]
    
    return (
      <div className={`rounded-lg border-2 p-4 my-6 ${bg} ${border}`}>
        <div className={`flex items-center gap-2 mb-2 ${text}`}>
          <Icon className="h-5 w-5" />
          {title && <span className="font-medium">{title}</span>}
        </div>
        <div className={`${text} prose-sm`}>
          {children}
        </div>
      </div>
    )
  },

  // Tech stack component
  TechStack: ({ technologies }: { technologies: string[] }) => (
    <div className="my-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Technologies Used</h4>
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  ),

  // Results metrics component
  Results: ({ metrics }: { metrics: { label: string; value: string; description?: string }[] }) => (
    <div className="my-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Project Results</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metric.value}</div>
            <div className="font-medium text-gray-900 dark:text-white">{metric.label}</div>
            {metric.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  ),

  // Video embed component
  Video: ({ muxId, cfId, title, poster }: { muxId?: string; cfId?: string; title?: string; poster?: string }) => (
    <div className="my-8">
      <VideoPlayer muxId={muxId} cfId={cfId} title={title} poster={poster} />
      {title && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 italic">
          {title}
        </p>
      )}
    </div>
  ),

  // 3D model embed component
  Model: ({ slug, title, description }: { slug: string; title?: string; description?: string }) => (
    <div className="my-8">
      <ModelViewer
        modelUrl={`/assets/models/${slug}.glb`}
        title={title || slug}
        description={description}
      />
    </div>
  ),
}

interface MDXContentProps {
  code: string
  className?: string
}

export default function MDXContent({ code, className = '' }: MDXContentProps) {
  const Component = useMDXComponent(code)

  return (
    <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
      <Component components={components} />
    </div>
  )
}
