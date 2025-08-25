'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF, useProgress, Html } from '@react-three/drei'
import { Suspense, useMemo, useState, useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Settings, RotateCcw, Eye, EyeOff } from 'lucide-react'

interface ModelProps {
  url: string
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url, true)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  return <primitive object={clonedScene} />
}

function Loader() {
  const { progress } = useProgress()
  
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <div className="w-64 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
          Loading model... {Math.round(progress)}%
        </p>
      </div>
    </Html>
  )
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-red-500 text-lg font-medium">Failed to load 3D model</div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          {error.message || 'There was an error loading the 3D model. Please try again.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

interface ControlsProps {
  quality: 'high' | 'low'
  onQualityChange: (quality: 'high' | 'low') => void
  onResetCamera: () => void
  showControls: boolean
  onToggleControls: () => void
}

function Controls({ quality, onQualityChange, onResetCamera, showControls, onToggleControls }: ControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <button
        onClick={onToggleControls}
        className="flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors"
        title={showControls ? 'Hide controls' : 'Show controls'}
      >
        {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      
      {showControls && (
        <div className="flex flex-col gap-2 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Quality</span>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => onQualityChange('low')}
              className={`px-2 py-1 text-xs rounded ${
                quality === 'low'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              } transition-colors`}
            >
              Low
            </button>
            <button
              onClick={() => onQualityChange('high')}
              className={`px-2 py-1 text-xs rounded ${
                quality === 'high'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              } transition-colors`}
            >
              High
            </button>
          </div>
          
          <button
            onClick={onResetCamera}
            className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset View
          </button>
        </div>
      )}
    </div>
  )
}

// Development FPS counter
function FPSCounter() {
  const [fps, setFps] = useState(0)
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    
    let frames = 0
    let lastTime = performance.now()
    
    function countFPS() {
      frames++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)))
        frames = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(countFPS)
    }
    
    const id = requestAnimationFrame(countFPS)
    return () => cancelAnimationFrame(id)
  }, [])
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="absolute top-4 right-4 z-10 px-2 py-1 bg-black/80 text-white text-xs font-mono rounded">
      {fps} FPS
    </div>
  )
}

export interface R3FSceneProps {
  modelUrl: string
  quality?: 'high' | 'low'
  initialCamera?: [number, number, number]
  className?: string
}

export default function R3FScene({
  modelUrl,
  quality: initialQuality = 'high',
  initialCamera = [2, 1.5, 3],
  className = 'h-[70vh] w-full',
}: R3FSceneProps) {
  const [quality, setQuality] = useState(initialQuality)
  const [showControls, setShowControls] = useState(true)
  const [cameraKey, setCameraKey] = useState(0)
  
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
  
  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1
    return quality === 'low' ? 1 : Math.min(1.5, window.devicePixelRatio)
  }, [quality])
  
  const resetCamera = () => {
    setCameraKey(prev => prev + 1)
  }
  
  return (
    <div className={`relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}>
      <Controls
        quality={quality}
        onQualityChange={setQuality}
        onResetCamera={resetCamera}
        showControls={showControls}
        onToggleControls={() => setShowControls(!showControls)}
      />
      
      <FPSCounter />
      
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Canvas
          key={cameraKey}
          camera={{ 
            position: initialCamera, 
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          dpr={dpr}
          flat
          frameloop={prefersReducedMotion ? 'never' : 'demand'}
          gl={{ 
            antialias: quality === 'high',
            alpha: true,
            powerPreference: quality === 'high' ? 'high-performance' : 'low-power'
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1}
            castShadow={quality === 'high'}
            shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
            shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
          />
          
          <Suspense fallback={<Loader />}>
            <Model url={modelUrl} />
            <Environment preset="city" background={false} />
          </Suspense>
          
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            screenSpacePanning={false}
            minDistance={0.5}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2}
            autoRotate={!prefersReducedMotion}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
