/**
 * Performance utilities for the portfolio
 */

// Check if device supports WebGL
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!context
  } catch (e) {
    return false
  }
}

// Check if device prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Get device capabilities
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasHighDPI: false,
      hasTouch: false,
      memoryGB: 4,
      gpuTier: 'high' as 'low' | 'medium' | 'high',
    }
  }

  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent)
  const isDesktop = !isMobile && !isTablet
  const hasHighDPI = window.devicePixelRatio > 1.5
  const hasTouch = 'ontouchstart' in window

  // Estimate available memory (rough heuristic)
  const memory = (navigator as any).deviceMemory || (isMobile ? 2 : 4)
  
  // Estimate GPU tier based on device characteristics
  let gpuTier: 'low' | 'medium' | 'high' = 'medium'
  if (isMobile && memory < 3) {
    gpuTier = 'low'
  } else if (isDesktop && memory >= 8) {
    gpuTier = 'high'
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    hasHighDPI,
    hasTouch,
    memoryGB: memory,
    gpuTier,
  }
}

// Performance observer for Core Web Vitals
export function observePerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  // Observe Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime)
      }
    }
  })

  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (e) {
    // Ignore if not supported
  }

  // Observe First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'first-input') {
        const fid = (entry as any).processingStart - entry.startTime
        console.log('FID:', fid)
      }
    }
  })

  try {
    fidObserver.observe({ entryTypes: ['first-input'] })
  } catch (e) {
    // Ignore if not supported
  }

  // Observe Cumulative Layout Shift (CLS)
  let clsValue = 0
  let clsEntries: any[] = []

  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        const firstSessionEntry = clsEntries[0]
        const lastSessionEntry = clsEntries[clsEntries.length - 1]

        if (
          !firstSessionEntry ||
          entry.startTime - lastSessionEntry.startTime < 1000 ||
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          clsEntries.push(entry)
          clsValue += (entry as any).value
        } else {
          clsEntries = [entry]
          clsValue = (entry as any).value
        }
      }
    }
    console.log('CLS:', clsValue)
  })

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (e) {
    // Ignore if not supported
  }
}

// Lazy load images with Intersection Observer
export function useLazyLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        img.src = img.dataset.src || ''
        img.classList.remove('lazy')
        imageObserver.unobserve(img)
      }
    })
  })

  const lazyImages = document.querySelectorAll('img[data-src]')
  lazyImages.forEach((img) => imageObserver.observe(img))
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  // Preload critical fonts
  const fontPreloads = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  ]

  fontPreloads.forEach((href) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
  })

  // Preload critical images
  const criticalImages = [
    '/assets/images/hero-bg.jpg',
    '/og-image.jpg',
  ]

  criticalImages.forEach((src) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })
}

// Resource cleanup for 3D scenes
export function cleanupThreeResources(scene: any) {
  if (!scene) return

  scene.traverse((object: any) => {
    if (object.geometry) {
      object.geometry.dispose()
    }

    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material: any) => {
          disposeMaterial(material)
        })
      } else {
        disposeMaterial(object.material)
      }
    }
  })
}

function disposeMaterial(material: any) {
  if (!material) return

  // Dispose textures
  Object.keys(material).forEach((key) => {
    const value = material[key]
    if (value && value.isTexture) {
      value.dispose()
    }
  })

  material.dispose()
}

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('To analyze bundle size, run: npm run analyze')
    console.log('This will open a visualization of your bundle composition')
  }
}

// Performance budget warnings
export function checkPerformanceBudget() {
  if (typeof window === 'undefined') return

  // Check if page load time exceeds budget
  window.addEventListener('load', () => {
    const loadTime = performance.now()
    const budget = 3000 // 3 seconds

    if (loadTime > budget) {
      console.warn(`Page load time (${Math.round(loadTime)}ms) exceeds budget (${budget}ms)`)
    }

    // Check bundle size (rough estimate)
    const scripts = Array.from(document.scripts)
    let totalSize = 0

    scripts.forEach((script) => {
      if (script.src && script.src.includes('_next')) {
        // This is a rough estimate - in production you'd use real metrics
        totalSize += 100 // KB estimate per script
      }
    })

    const sizeBudget = 500 // 500KB
    if (totalSize > sizeBudget) {
      console.warn(`Estimated bundle size (${totalSize}KB) exceeds budget (${sizeBudget}KB)`)
    }
  })
}
