import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  progress?: number // 0-100 for progress bar
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '',
  progress 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} />
        
        {/* Progress ring overlay if progress is provided */}
        {typeof progress === 'number' && (
          <svg
            className={`absolute inset-0 ${sizeClasses[size]} transform -rotate-90`}
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 10}`}
              strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
              className="text-blue-600 dark:text-blue-400 transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {text}
          {typeof progress === 'number' && ` (${Math.round(progress)}%)`}
        </p>
      )}
      
      {typeof progress === 'number' && !text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  )
}

// Skeleton loader for cards
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}>
      <div className="aspect-video bg-gray-300 dark:bg-gray-600 rounded-t-lg"></div>
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for text content
export function SkeletonText({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-300 dark:bg-gray-600 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  )
}

// 3D model loading component
export function Model3DLoader({ 
  progress = 0, 
  className = '' 
}: { 
  progress?: number
  className?: string 
}) {
  return (
    <div className={`flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}>
      <div className="relative mb-4">
        {/* 3D cube loader animation */}
        <div className="w-12 h-12 relative">
          <div className="w-full h-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-blue-100 dark:border-blue-900 border-r-blue-500 dark:border-r-blue-300 rounded-full animate-spin animate-reverse"></div>
        </div>
        
        {/* Progress overlay */}
        {progress > 0 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Loading 3D model...
        {progress > 0 && ` ${Math.round(progress)}%`}
      </p>
      
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        This may take a moment on slower connections
      </p>
    </div>
  )
}

// Loading overlay for full screen
export function LoadingOverlay({ 
  isVisible, 
  text = 'Loading...',
  progress 
}: { 
  isVisible: boolean
  text?: string
  progress?: number 
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
        <LoadingSpinner size="lg" text={text} progress={progress} />
      </div>
    </div>
  )
}

// Suspense fallback for lazy loaded components
export function SuspenseFallback({ 
  text = 'Loading component...',
  height = 'h-64' 
}: { 
  text?: string
  height?: string 
}) {
  return (
    <div className={`${height} flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg`}>
      <LoadingSpinner text={text} />
    </div>
  )
}
