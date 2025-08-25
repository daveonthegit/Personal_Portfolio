'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoPlayerProps {
  muxId?: string
  cfId?: string
  title?: string
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  className?: string
  captions?: {
    src: string
    label: string
    default?: boolean
  }[]
}

export default function VideoPlayer({
  muxId,
  cfId,
  title,
  poster,
  autoPlay = false,
  loop = false,
  muted = true,
  className = '',
  captions = [],
}: VideoPlayerProps) {
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check environment variables for provider configuration
  const hasMux = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MUX_TOKEN
  const hasCloudflare = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CF_ACCOUNT_ID

  if (!isClient) {
    return (
      <div className={`aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">Loading video player...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <div className="text-red-500 font-medium">Video Error</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      </div>
    )
  }

  // Mux Player
  if (muxId && (hasMux || !hasCloudflare)) {
    return (
      <div className={`relative ${className}`}>
        <mux-player
          stream-type="on-demand"
          playback-id={muxId}
          metadata-video-title={title}
          poster={poster}
          autoplay={autoPlay ? 'muted' : 'false'}
          loop={loop}
          muted={muted}
          preload="metadata"
          style={{ 
            width: '100%', 
            aspectRatio: '16/9',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}
          onError={(e: any) => {
            console.error('Mux player error:', e)
            setError('Failed to load video from Mux')
          }}
        >
          {captions.map((caption, index) => (
            <track
              key={index}
              kind="captions"
              src={caption.src}
              label={caption.label}
              default={caption.default}
            />
          ))}
        </mux-player>
      </div>
    )
  }

  // Cloudflare Stream
  if (cfId && (hasCloudflare || !hasMux)) {
    const streamUrl = `https://iframe.videodelivery.net/${cfId}`
    const params = new URLSearchParams({
      preload: 'metadata',
      autoplay: autoPlay ? 'true' : 'false',
      loop: loop ? 'true' : 'false',
      muted: muted ? 'true' : 'false',
    })

    if (poster) {
      params.set('poster', poster)
    }

    return (
      <div className={`relative ${className}`}>
        <iframe
          src={`${streamUrl}?${params.toString()}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ 
            width: '100%', 
            aspectRatio: '16/9', 
            border: 0,
            borderRadius: '0.5rem'
          }}
          title={title || 'Video player'}
          onError={() => {
            setError('Failed to load video from Cloudflare Stream')
          }}
        />
      </div>
    )
  }

  // Fallback - show configuration message
  return (
    <div className={`aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center space-y-4 p-6 max-w-md">
        <div className="text-gray-600 dark:text-gray-400">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">Video Player Configuration Needed</h3>
          <p className="text-sm">
            To display videos, configure either Mux or Cloudflare Stream by setting the appropriate environment variables:
          </p>
        </div>
        <div className="text-xs text-left bg-gray-50 dark:bg-gray-900 p-3 rounded font-mono">
          <div>NEXT_PUBLIC_MUX_TOKEN=your_token</div>
          <div className="text-gray-500 dark:text-gray-500">or</div>
          <div>NEXT_PUBLIC_CF_ACCOUNT_ID=your_id</div>
        </div>
      </div>
    </div>
  )
}

// Custom hook for video player controls (if building custom player)
export function useVideoControls(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const seek = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
  }

  const setVideoVolume = (newVolume: number) => {
    if (!videoRef.current) return
    videoRef.current.volume = newVolume
    setVolume(newVolume)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  return {
    isPlaying,
    isMuted,
    currentTime,
    duration,
    volume,
    togglePlay,
    toggleMute,
    seek,
    setVolume: setVideoVolume,
  }
}
