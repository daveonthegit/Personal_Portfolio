import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { ChevronLeft, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { allProjects } from 'contentlayer/generated'

// Dynamically import R3FScene to prevent SSR issues
const R3FScene = dynamic(() => import('@/components/R3FScene'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading 3D viewer...</p>
      </div>
    </div>
  ),
})

// Define available models - in a real app, this could come from a database or file system
const MODEL_REGISTRY: Record<string, {
  name: string
  description: string
  fileName: string
  fileSize?: string
  triangleCount?: string
  category: string
  projectSlug?: string
}> = {
  'sample-chair': {
    name: 'Modern Chair Design',
    description: 'A contemporary chair design showcasing clean lines and modern aesthetics. Created in Blender with PBR materials.',
    fileName: 'sample-chair.glb',
    fileSize: '2.4 MB',
    triangleCount: '15.2k',
    category: 'Furniture',
    projectSlug: 'furniture-visualization',
  },
  'architectural-scene': {
    name: 'Architectural Visualization',
    description: 'A detailed architectural scene demonstrating lighting and material techniques for realistic rendering.',
    fileName: 'architectural-scene.glb',
    fileSize: '4.8 MB',
    triangleCount: '32.1k',
    category: 'Architecture',
    projectSlug: 'architectural-visualization',
  },
  'product-showcase': {
    name: 'Product Showcase',
    description: 'High-quality product visualization with attention to detail and photorealistic materials.',
    fileName: 'product-showcase.glb',
    fileSize: '1.9 MB',
    triangleCount: '8.7k',
    category: 'Product Design',
    projectSlug: 'product-visualization',
  },
}

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const model = MODEL_REGISTRY[params.slug]
  
  if (!model) {
    return {
      title: '3D Model Not Found',
    }
  }

  return {
    title: `${model.name} - 3D Model`,
    description: model.description,
    openGraph: {
      title: `${model.name} - 3D Model`,
      description: model.description,
      type: 'website',
      images: [
        {
          url: `/assets/models/previews/${params.slug}.jpg`,
          width: 1200,
          height: 630,
          alt: model.name,
        }
      ],
    },
  }
}

export function generateStaticParams() {
  return Object.keys(MODEL_REGISTRY).map((slug) => ({
    slug,
  }))
}

export default function ModelViewerPage({ params }: PageProps) {
  const model = MODEL_REGISTRY[params.slug]

  if (!model) {
    notFound()
  }

  const modelUrl = `/assets/models/${model.fileName}`
  const downloadUrl = modelUrl
  
  // Find related project if it exists
  const relatedProject = model.projectSlug 
    ? allProjects.find(p => p.slug === model.projectSlug)
    : null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {model.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                {model.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {model.category}
                </span>
                {model.fileSize && (
                  <span>{model.fileSize}</span>
                )}
                {model.triangleCount && (
                  <span>{model.triangleCount} triangles</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={downloadUrl}
                download
                className="btn-secondary inline-flex items-center gap-2"
                title="Download 3D model"
              >
                <Download className="h-4 w-4" />
                Download GLB
              </a>
              
              {relatedProject && (
                <Link
                  href={relatedProject.url}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  View Project
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="mb-12">
          <R3FScene
            modelUrl={modelUrl}
            quality="high"
            initialCamera={[3, 2, 4]}
            className="h-[80vh] w-full"
          />
        </div>

        {/* Model Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Technical Details */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Technical Specifications
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Format:</span>
                    <span className="text-gray-600 dark:text-gray-400">GLB/glTF 2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Compression:</span>
                    <span className="text-gray-600 dark:text-gray-400">Draco</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Materials:</span>
                    <span className="text-gray-600 dark:text-gray-400">PBR</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {model.fileSize && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">File Size:</span>
                      <span className="text-gray-600 dark:text-gray-400">{model.fileSize}</span>
                    </div>
                  )}
                  {model.triangleCount && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Triangles:</span>
                      <span className="text-gray-600 dark:text-gray-400">{model.triangleCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Textures:</span>
                    <span className="text-gray-600 dark:text-gray-400">1K-2K</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Creation Process
              </h2>
              
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This 3D model was created using industry-standard tools and techniques:
                </p>
                
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Modeling in Blender with subdivision surface workflows</li>
                  <li>• UV mapping with optimized texture atlases</li>
                  <li>• PBR material authoring with Substance Painter</li>
                  <li>• Exported with Draco compression for web optimization</li>
                  <li>• Validated in gltf-viewer for compatibility</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Controls Guide */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Viewer Controls
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span className="font-medium">Rotate:</span>
                  <span>Left click + drag</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pan:</span>
                  <span>Right click + drag</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Zoom:</span>
                  <span>Scroll wheel</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reset:</span>
                  <span>Click reset button</span>
                </div>
              </div>
            </div>

            {/* Performance Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Performance Note
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                This model is optimized for web viewing with Draco compression. 
                For best performance, use the quality toggle in the top-left corner.
              </p>
            </div>

            {/* Related Project */}
            {relatedProject && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Related Project
                </h3>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    {relatedProject.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {relatedProject.summary}
                  </p>
                  <Link
                    href={relatedProject.url}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    View Full Project
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
