import type { UploadConfig } from "../types"

export const defaultConfig: UploadConfig = {
  uploadDir: "public/uploads",
  docsDir: "public/docs",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  webpQuality: 80,
  supportedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"],
  supportedDocTypes: ["application/pdf"],
  enableLogging: true,
  logLevel: "info",
  // Enhanced features defaults
  generateThumbnails: false,
  enableMetadata: false,
  enableProgressTracking: false,
  auth: {
    enabled: false,
  },
}

// Helper function to get complete config with defaults
export const getCompleteConfig = (userConfig: UploadConfig = {}): Required<UploadConfig> => {
  return {
    uploadDir: userConfig.uploadDir ?? defaultConfig.uploadDir!,
    docsDir: userConfig.docsDir ?? defaultConfig.docsDir!,
    maxFileSize: userConfig.maxFileSize ?? defaultConfig.maxFileSize!,
    webpQuality: userConfig.webpQuality ?? defaultConfig.webpQuality!,
    supportedImageTypes: userConfig.supportedImageTypes ?? defaultConfig.supportedImageTypes!,
    supportedDocTypes: userConfig.supportedDocTypes ?? defaultConfig.supportedDocTypes!,
    enableLogging: userConfig.enableLogging ?? defaultConfig.enableLogging!,
    logLevel: userConfig.logLevel ?? defaultConfig.logLevel!,
    generateThumbnails: userConfig.generateThumbnails ?? false,
    enableMetadata: userConfig.enableMetadata ?? false,
    enableProgressTracking: userConfig.enableProgressTracking ?? false,
    auth: {
      enabled: userConfig.auth?.enabled ?? false,
      jwtSecret: userConfig.auth?.jwtSecret,
      apiKey: userConfig.auth?.apiKey,
      customValidator: userConfig.auth?.customValidator,
    },
    rateLimiting: userConfig.rateLimiting ?? {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    },
    imageSizes: userConfig.imageSizes ?? {},
    corsOrigins: userConfig.corsOrigins ?? [],
  }
}
