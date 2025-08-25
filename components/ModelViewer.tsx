'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ChevronLeft, ExternalLink, Download } from 'lucide-react'
import Link from 'next/link'

// Dynamically import R3FScene to prevent SSR issues
const R3FScene = dynamic(() => import('./R3FScene'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading 3D viewer...</p>
      </div>
    </div>
  ),
})

interface ModelViewerProps {
  modelUrl: string
  title: string
  description?: string
  downloadUrl?: string
  projectUrl?: string
  className?: string
}

export default function ModelViewer({
  modelUrl,
  title,
  description,
  downloadUrl,
  projectUrl,
  className,
}: ModelViewerProps) {
  const [quality, setQuality] = useState<'high' | 'low'>('high')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="btn-secondary inline-flex items-center gap-2"
              title="Download 3D model"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          )}
          {projectUrl && (
            <Link
              href={projectUrl}
              className="btn-primary inline-flex items-center gap-2"
            >
              View Project
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 3D Viewer */}
      <R3FScene
        modelUrl={modelUrl}
        quality={quality}
        initialCamera={[3, 2, 4]}
      />

      {/* Info Panel */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          3D Model Information
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Format:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">GLB/glTF 2.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Compression:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Draco</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Lighting:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">PBR Materials</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Controls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>• Left click + drag: Rotate</div>
            <div>• Right click + drag: Pan</div>
            <div>• Scroll wheel: Zoom</div>
            <div>• Touch: Pinch to zoom, drag to rotate</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-500">
          <p>
            Optimized for web with Draco compression. Best viewed in Chrome, Firefox, or Safari.
            {quality === 'low' && ' Currently in low quality mode for better performance.'}
          </p>
        </div>
      </div>
    </div>
  )
}
