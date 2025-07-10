// Main exports
export { createUploadHandler, config } from "./api/handler"
export { createEnhancedUploadHandler } from "./api/enhancedHandler"
export { createProgressHandler } from "./api/progressHandler"
export { FileHandler } from "./core/fileHandler"
export { EnhancedFileHandler } from "./core/enhancedFileHandler"
export { defaultConfig } from "./config/default"
export { initLogger, getLogger } from "./utils/logger"

// Enhanced features
export { AuthMiddleware } from "./middleware/auth"
export { RateLimiter } from "./utils/rateLimiter"
export { ProgressTracker } from "./utils/progressTracker"
export { ImageOptimizer } from "./utils/imageOptimizer"
export { MetadataExtractor } from "./utils/fileMetadata"

// Type exports
export type {
  UploadConfig,
  FileUploadResult,
  UploadResponse,
  DeleteRequest,
  UpdateRequest,
  ProcessedFile,
  ValidationResult,
  AuthConfig,
  RateLimitConfig,
  ImageSizes,
  FileMetadata,
  ProgressResponse,
} from "./types"

// Utility exports
export { ensureDirectoryExists, deleteFile, fileExists } from "./utils/fileSystem"

export { validateFile, sanitizeFilename, isImageFile, isPdfFile } from "./utils/validation"

export { processImage } from "./utils/imageProcessor"
