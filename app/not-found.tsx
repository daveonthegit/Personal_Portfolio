import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Animation */}
        <div className="relative">
          <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-blue-500/30 rounded-full animate-pulse" />
            <div className="absolute w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, even the best developers get lost sometimes!
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          
          <Link
            href="/projects"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            Browse Projects
          </Link>
        </div>

        {/* Suggestions */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            You might be looking for:
          </h2>
          
          <div className="space-y-2">
            <Link
              href="/projects"
              className="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              → View all projects
            </Link>
            <Link
              href="/about"
              className="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              → Learn more about me
            </Link>
            <Link
              href="/contact"
              className="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              → Get in touch
            </Link>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Go back
        </button>
      </div>
    </div>
  )
}
