import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
// Temporary: commenting out contentlayer import to fix build
// import { allProjects } from 'contentlayer/generated'
import { ChevronLeft, ExternalLink, Github, Calendar, Eye, Play } from 'lucide-react'
import MDXContent from '@/components/MDXContent'

// Dynamically import heavy components
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Loading video...</div>
    </div>
  ),
})

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Loading 3D model...</div>
    </div>
  ),
})

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Project: ${params.slug}`,
    description: 'Project details and case study',
  }
}

export function generateStaticParams() {
  return [
    { slug: 'sample-project' },
    { slug: 'sample-project-2' }
  ]
}

export default function ProjectPage({ params }: PageProps) {
  // Temporary: using mock data
  const mockProjects: any = {
    'sample-project': {
      title: 'E-Commerce Platform',
      summary: 'Modern e-commerce with 3D product visualization',
      date: '2024-01-15',
      tags: ['Next.js', 'Three.js', 'TypeScript', 'E-commerce'],
      repoUrl: 'https://github.com/yourusername/project',
      liveUrl: 'https://project-demo.com',
      body: { code: '# Sample Project\n\nThis is a sample project description.' }
    },
    'sample-project-2': {
      title: 'Architectural Visualization',
      summary: 'Real-time 3D building exploration platform',
      date: '2023-11-20',
      tags: ['React', 'WebGL', 'Architecture', 'Three.js'],
      repoUrl: 'https://github.com/yourusername/project2',
      liveUrl: 'https://project2-demo.com',
      body: { code: '# Architectural Project\n\nThis is another sample project description.' }
    }
  }

  const project = mockProjects[params.slug]

  if (!project) {
    notFound()
  }

  const formattedDate = new Date(project.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Temporary: empty related projects
  const relatedProjects: any[] = []

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Navigation */}
        <nav className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-12 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              {project.title}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              {project.summary}
            </p>
          </div>

          {/* Meta information */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={project.date}>{formattedDate}</time>
              </div>
              
              {project.modelSlug && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>3D Model</span>
                </div>
              )}
              
              {project.videoId && (
                <div className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  <span>Video</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  View Code
                </a>
              )}
              
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Live Demo
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Hero Image */}
        {project.hero && (
          <div className="mb-12">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src={project.hero}
                alt={`${project.title} preview`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          </div>
        )}

        {/* Embedded Video */}
        {project.videoId && (
          <div className="mb-12">
            <VideoPlayer
              muxId={project.videoId.startsWith('mux:') ? project.videoId.replace('mux:', '') : undefined}
              cfId={project.videoId.startsWith('cf:') ? project.videoId.replace('cf:', '') : project.videoId}
              title={`${project.title} Demo`}
              autoPlay={false}
              muted={true}
            />
          </div>
        )}

        {/* Embedded 3D Model */}
        {project.modelSlug && (
          <div className="mb-12">
            <ModelViewer
              modelUrl={`/assets/models/${project.modelSlug}.glb`}
              title={`${project.title} 3D Model`}
              description="Interactive 3D model - click and drag to rotate, scroll to zoom"
              projectUrl={project.liveUrl}
              downloadUrl={`/assets/models/${project.modelSlug}.glb`}
            />
          </div>
        )}

        {/* Project Content */}
        <div className="mb-16">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p>{project.body.code}</p>
          </div>
        </div>

        {/* Project Metrics */}
        {project.metrics && (
          <div className="mb-16 p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Project Impact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {project.metrics.performance && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {project.metrics.performance}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Performance Score
                  </div>
                </div>
              )}
              {project.metrics.users && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {project.metrics.users}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Active Users
                  </div>
                </div>
              )}
              {project.metrics.conversion && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {project.metrics.conversion}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Conversion Rate
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section className="border-t border-gray-200 dark:border-gray-700 pt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Related Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((relatedProject) => (
                <Link
                  key={relatedProject.slug}
                  href={relatedProject.url}
                  className="group block"
                >
                  <article className="card p-4 h-full hover:shadow-lg transition-shadow">
                    {relatedProject.hero && (
                      <div className="relative aspect-video mb-3 rounded-lg overflow-hidden">
                        <Image
                          src={relatedProject.hero}
                          alt={`${relatedProject.title} preview`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {relatedProject.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {relatedProject.summary}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
