// Global type definitions for the portfolio

export interface Project {
  _id: string
  _raw: {
    flattenedPath: string
    contentType: string
  }
  type: 'Project'
  title: string
  date: string
  summary: string
  tags?: string[]
  hero?: string
  repoUrl?: string
  liveUrl?: string
  modelSlug?: string
  videoId?: string
  metrics?: ProjectMetrics
  body: {
    code: string
    raw: string
  }
  url: string
  slug: string
}

export interface ProjectMetrics {
  performance?: string
  users?: string
  conversion?: string
}

export interface ModelData {
  name: string
  description: string
  fileName: string
  fileSize?: string
  triangleCount?: string
  category: string
  projectSlug?: string
}

export interface SocialLink {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface ContactMethod {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  value: string
  href: string
  primary?: boolean
}

export interface Skill {
  name: string
  level: number
  years: string
}

export interface SkillCategory {
  title: string
  skills: Skill[]
}

export interface TimelineItem {
  year: string
  title: string
  company: string
  description: string
  current?: boolean
}

export interface Interest {
  title: string
  description: string
  icon: string
}

export interface VideoPlayerProps {
  muxId?: string
  cfId?: string
  title?: string
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  className?: string
  captions?: VideoCaptions[]
}

export interface VideoCaptions {
  src: string
  label: string
  default?: boolean
}

export interface R3FSceneProps {
  modelUrl: string
  quality?: 'high' | 'low'
  initialCamera?: [number, number, number]
  className?: string
}

export interface DeviceCapabilities {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasHighDPI: boolean
  hasTouch: boolean
  memoryGB: number
  gpuTier: 'low' | 'medium' | 'high'
}

export interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  loadTime?: number
  bundleSize?: number
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  progress?: number
}

export interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
}

export interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  external?: boolean
}

export interface FAQ {
  question: string
  answer: string
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  budget?: string
}

// Three.js related types
export interface ModelViewerProps {
  modelUrl: string
  title: string
  description?: string
  downloadUrl?: string
  projectUrl?: string
  className?: string
}

export interface ThreeJSModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
  materials: THREE.Material[]
  cameras: THREE.Camera[]
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type WithClassName<T = {}> = T & { className?: string }

export type WithChildren<T = {}> = T & { children: React.ReactNode }

// Environment variables
export interface EnvironmentVariables {
  NEXT_PUBLIC_SITE_URL: string
  NEXT_PUBLIC_SITE_NAME: string
  NEXT_PUBLIC_MUX_TOKEN?: string
  NEXT_PUBLIC_CF_ACCOUNT_ID?: string
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN?: string
  NEXT_PUBLIC_GA_ID?: string
  REVALIDATE_SECRET?: string
  NEXT_PUBLIC_GITHUB_USERNAME: string
  NEXT_PUBLIC_LINKEDIN_USERNAME: string
  NEXT_PUBLIC_EMAIL: string
  NEXT_PUBLIC_ENABLE_3D_MODELS: string
  NEXT_PUBLIC_ENABLE_CONTACT_FORM: string
  NEXT_PUBLIC_ENABLE_ANALYTICS: string
}

// Content management
export interface ContentMeta {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  author: string
  tags: string[]
  readingTime: number
  wordCount: number
}

export interface ContentFilter {
  tags?: string[]
  search?: string
  sortBy?: 'date' | 'title' | 'readingTime'
  sortOrder?: 'asc' | 'desc'
}

// Analytics
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
}

export interface PageViewEvent extends AnalyticsEvent {
  name: 'page_view'
  properties: {
    path: string
    title: string
    referrer?: string
  }
}

export interface ProjectViewEvent extends AnalyticsEvent {
  name: 'project_view'
  properties: {
    projectSlug: string
    projectTitle: string
  }
}

export interface ModelViewEvent extends AnalyticsEvent {
  name: 'model_view'
  properties: {
    modelSlug: string
    modelName: string
  }
}

export interface ContactFormEvent extends AnalyticsEvent {
  name: 'contact_form_submit'
  properties: {
    budget?: string
    hasAttachment?: boolean
  }
}

// Global app state (if using context)
export interface AppState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  user?: UserProfile
  preferences: UserPreferences
}

export interface UserProfile {
  name: string
  email: string
  avatar?: string
  role: 'visitor' | 'admin'
}

export interface UserPreferences {
  reducedMotion: boolean
  autoplay: boolean
  quality3D: 'low' | 'high'
  language: string
}

// API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form validation
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface FormState<T> {
  values: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

// Search functionality
export interface SearchResult {
  type: 'project' | 'page' | 'model'
  title: string
  description: string
  url: string
  relevance: number
  highlights?: string[]
}

export interface SearchQuery {
  query: string
  filters?: ContentFilter
  limit?: number
  offset?: number
}
