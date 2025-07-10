export interface UploadConfig {
  uploadDir?: string
  docsDir?: string
  maxFileSize?: number
  webpQuality?: number
  supportedImageTypes?: string[]
  supportedDocTypes?: string[]
  enableLogging?: boolean
  logLevel?: "error" | "warn" | "info" | "debug"
  // New features
  auth?: AuthConfig
  rateLimiting?: RateLimitConfig
  generateThumbnails?: boolean
  imageSizes?: ImageSizes
  enableMetadata?: boolean
  enableProgressTracking?: boolean
  corsOrigins?: string[]
}

export interface AuthConfig {
  enabled: boolean
  jwtSecret?: string
  apiKey?: string
  customValidator?: (req: any) => Promise<boolean> | boolean
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: any) => string
}

export interface ImageSizes {
  thumbnail?: { width: number; height: number }
  medium?: { width: number; height: number }
  large?: { width: number; height: number }
}

export interface FileUploadResult {
  url: string
  size: number
  type: string
  originalName: string
  // New fields
  hash?: string
  metadata?: FileMetadata
  thumbnails?: {
    thumbnail?: string
    medium?: string
    large?: string
  }
  uploadId?: string
}

export interface FileMetadata {
  filename: string
  originalName: string
  size: number
  mimeType: string
  hash: string
  uploadedAt: Date
  dimensions?: { width: number; height: number }
  duration?: number
}

export interface UploadResponse {
  success: boolean
  data?: FileUploadResult | FileUploadResult[]
  error?: string
  message?: string
  uploadId?: string
}

export interface DeleteRequest {
  filePath: string
}

export interface UpdateRequest {
  oldFilePath?: string
}

// Make ProcessedFile extend FileUploadResult to ensure compatibility
export interface ProcessedFile extends FileUploadResult {
  // All properties are inherited from FileUploadResult
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface ProgressResponse {
  uploadId: string
  filename: string
  totalSize: number
  uploadedSize: number
  percentage: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
}
