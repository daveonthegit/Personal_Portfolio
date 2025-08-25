'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error!} reset={this.handleReset} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  reset: () => void
}

function DefaultErrorFallback({ error, reset }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an unexpected error. This might be a temporary issue.
        </p>

        {isDevelopment && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error details (development only)
            </summary>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
              <div className="font-semibold mb-1">{error.name}:</div>
              <div className="mb-2">{error.message}</div>
              {error.stack && (
                <div className="text-gray-600 dark:text-gray-400">
                  {error.stack.split('\n').slice(0, 10).join('\n')}
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
          If this problem persists, please{' '}
          <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
            contact me
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

// Specific error boundary for 3D components
export function ThreeErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={ThreeErrorFallback}
      onError={(error, errorInfo) => {
        console.error('3D component error:', error)
        // You might want to track 3D-specific errors differently
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function ThreeErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
      <div className="text-center space-y-4 p-6">
        <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            3D Viewer Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
            Unable to load the 3D model. This might be due to browser compatibility or network issues.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={reset} className="btn-primary text-sm px-4 py-2">
            Retry Loading
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Try refreshing the page or using a different browser
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}
