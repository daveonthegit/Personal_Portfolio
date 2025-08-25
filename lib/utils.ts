import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date consistently across the app
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

// Truncate text to specified length
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Generate reading time estimate
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Check if code is running on server
export function isServer(): boolean {
  return typeof window === 'undefined'
}

// Check if code is running on client
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

// Get file extension from URL
export function getFileExtension(url: string): string {
  return url.split('.').pop()?.toLowerCase() || ''
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Generate color from string (for avatars, etc.)
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

// Check if URL is external
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.origin !== window.location.origin
  } catch {
    return false
  }
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Scroll to element smoothly
export function scrollToElement(
  elementId: string,
  offset: number = 0
): void {
  const element = document.getElementById(elementId)
  if (element) {
    const yPosition = element.offsetTop - offset
    window.scrollTo({
      top: yPosition,
      behavior: 'smooth',
    })
  }
}

// Local storage helpers with error handling
export const storage = {
  get: (key: string): any => {
    if (isServer()) return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key: string, value: any): boolean => {
    if (isServer()) return false
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove: (key: string): boolean => {
    if (isServer()) return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
}

// URL parameter helpers
export function getUrlParameter(name: string): string | null {
  if (isServer()) return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

export function setUrlParameter(name: string, value: string): void {
  if (isServer()) return
  
  const url = new URL(window.location.href)
  url.searchParams.set(name, value)
  window.history.pushState({}, '', url.toString())
}

// Array utilities
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function uniqueArray<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups: Record<string, T[]>, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}
