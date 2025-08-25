import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ExternalLink, Github, Eye, Play } from 'lucide-react'
import type { Project } from 'contentlayer/generated'

interface ProjectCardProps {
  project: Project
  className?: string
}

export default function ProjectCard({ project, className = '' }: ProjectCardProps) {
  const formattedDate = new Date(project.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className={`card group hover:shadow-lg transition-all duration-300 ${className}`}>
      {/* Hero Image */}
      {project.hero && (
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={project.hero}
            alt={`${project.title} preview`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          
          {/* Media indicators */}
          <div className="absolute top-4 right-4 flex gap-2">
            {project.modelSlug && (
              <div className="bg-black/80 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Eye className="h-3 w-3" />
                3D
              </div>
            )}
            {project.videoId && (
              <div className="bg-black/80 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Play className="h-3 w-3" />
                Video
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <time 
              dateTime={project.date}
              className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </time>
            
            {/* Quick actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="View source code"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="View live demo"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </a>
              )}
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <Link href={project.url} className="before:absolute before:inset-0">
              {project.title}
            </Link>
          </h3>
        </div>

        {/* Summary */}
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
          {project.summary}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2.5 py-0.5">
                +{project.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Metrics */}
        {project.metrics && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {project.metrics.performance && (
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {project.metrics.performance}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Performance</div>
              </div>
            )}
            {project.metrics.users && (
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {project.metrics.users}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
              </div>
            )}
            {project.metrics.conversion && (
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {project.metrics.conversion}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Conversion</div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

// Compact version for featured projects
export function ProjectCardCompact({ project, className = '' }: ProjectCardProps) {
  return (
    <article className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-300 group ${className}`}>
      {project.hero && (
        <div className="absolute inset-0">
          <Image
            src={project.hero}
            alt={`${project.title} preview`}
            fill
            className="object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}
      
      <div className="relative p-6 h-full flex flex-col justify-end text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Calendar className="h-3 w-3" />
            {new Date(project.date).getFullYear()}
          </div>
          
          <h3 className="text-lg font-semibold group-hover:text-blue-300 transition-colors">
            <Link href={project.url} className="before:absolute before:inset-0">
              {project.title}
            </Link>
          </h3>
          
          <p className="text-sm opacity-90 line-clamp-2">
            {project.summary}
          </p>
          
          {project.tags && (
            <div className="flex flex-wrap gap-1 pt-2">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-white/20 rounded-full backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
