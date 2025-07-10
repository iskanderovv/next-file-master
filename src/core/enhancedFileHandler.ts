import formidable from "formidable"
import type { NextApiRequest } from "next"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import type { UploadConfig, ProcessedFile } from "../types"
import { getCompleteConfig } from "../config/default"
import { ensureDirectoryExists, deleteFile, fileExists } from "../utils/fileSystem"
import { validateFile, sanitizeFilename, isImageFile, isPdfFile } from "../utils/validation"
import { ImageOptimizer } from "../utils/imageOptimizer"
import { MetadataExtractor } from "../utils/fileMetadata"
import { ProgressTracker } from "../utils/progressTracker"
import { AuthMiddleware } from "../middleware/auth"
import { RateLimiter } from "../utils/rateLimiter"
import { getLogger } from "../utils/logger"

export class EnhancedFileHandler {
  private config: Required<UploadConfig>
  private imageOptimizer: ImageOptimizer
  private metadataExtractor: MetadataExtractor
  private progressTracker: ProgressTracker
  private authMiddleware?: AuthMiddleware
  private rateLimiter?: RateLimiter

  constructor(config: UploadConfig = {}) {
    this.config = getCompleteConfig(config)
    this.imageOptimizer = new ImageOptimizer(this.config)
    this.metadataExtractor = new MetadataExtractor()
    this.progressTracker = ProgressTracker.getInstance()

    // Initialize auth middleware if enabled
    if (this.config.auth?.enabled) {
      this.authMiddleware = new AuthMiddleware(this.config.auth)
    }

    // Initialize rate limiter if configured
    if (this.config.rateLimiting) {
      this.rateLimiter = new RateLimiter(this.config.rateLimiting)
    }
  }

  async uploadFiles(req: NextApiRequest): Promise<ProcessedFile[]> {
    const logger = getLogger()

    try {
      // Check authentication
      if (this.authMiddleware) {
        const authResult = await this.authMiddleware.validateRequest(req)
        if (!authResult.isValid) {
          throw new Error(authResult.error || "Authentication failed")
        }
      }

      // Check rate limiting
      if (this.rateLimiter) {
        const rateLimitResult = await this.rateLimiter.checkLimit(req)
        if (!rateLimitResult.allowed) {
          throw new Error("Rate limit exceeded")
        }
      }

      // Ensure directories exist
      await ensureDirectoryExists(this.config.uploadDir)
      await ensureDirectoryExists(this.config.docsDir)

      const { files } = await this.parseRequest(req)
      const fileArray = Array.isArray(files.file) ? files.file : [files.file]

      const processedFiles: ProcessedFile[] = []

      for (const file of fileArray) {
        if (!file) continue

        const uploadId = uuidv4()

        try {
          // Create progress tracking
          if (this.config.enableProgressTracking) {
            this.progressTracker.createProgress(uploadId, file.originalFilename || "unknown", file.size)
          }

          // Validate file
          const validation = validateFile(file, this.config)
          if (!validation.isValid) {
            throw new Error(validation.error)
          }

          const sanitizedName = sanitizeFilename(file.originalFilename || "unknown")
          let processedFile: ProcessedFile

          if (isImageFile(file.mimetype, this.config)) {
            processedFile = await this.processImage(file, sanitizedName, uploadId)
          } else if (isPdfFile(file.mimetype)) {
            processedFile = await this.processPdf(file, sanitizedName, uploadId)
          } else {
            throw new Error(`Unsupported file type: ${file.mimetype}`)
          }

          // Update progress
          if (this.config.enableProgressTracking) {
            this.progressTracker.setStatus(uploadId, "completed")
          }

          processedFiles.push(processedFile)
        } catch (error) {
          if (this.config.enableProgressTracking) {
            this.progressTracker.setStatus(uploadId, "error", error instanceof Error ? error.message : "Unknown error")
          }
          throw error
        }
      }

      logger.info(`Successfully processed ${processedFiles.length} files`)
      return processedFiles
    } catch (error) {
      logger.error("File upload failed", error)
      throw error
    }
  }

  private async processImage(file: any, sanitizedName: string, uploadId: string): Promise<ProcessedFile> {
    const logger = getLogger()

    if (this.config.enableProgressTracking) {
      this.progressTracker.setStatus(uploadId, "processing")
    }

    let finalUrl: string
    let thumbnails: ProcessedFile["thumbnails"] = {}

    if (this.config.generateThumbnails && this.config.imageSizes) {
      // Generate multiple sizes
      const optimizedImages = await this.imageOptimizer.generateMultipleSizes(
        file.filepath,
        this.config.uploadDir,
        this.config.imageSizes,
      )

      finalUrl = optimizedImages.original
      thumbnails = {
        thumbnail: optimizedImages.thumbnail,
        medium: optimizedImages.medium,
        large: optimizedImages.large,
      }
    } else {
      // Single WebP conversion
      const filename = `${uuidv4()}.webp`
      const outputPath = path.join(this.config.uploadDir, filename)
      const sharp = await import("sharp")
      await sharp.default(file.filepath).webp({ quality: this.config.webpQuality }).toFile(outputPath)
      finalUrl = `/${path.relative("public", outputPath).replace(/\\/g, "/")}`
    }

    const processedFile: ProcessedFile = {
      url: finalUrl,
      originalName: sanitizedName,
      size: file.size,
      type: "image/webp",
    }

    if (Object.keys(thumbnails).length > 0) {
      processedFile.thumbnails = thumbnails
    }

    // Extract metadata if enabled
    if (this.config.enableMetadata) {
      const metadata = await this.metadataExtractor.extractMetadata(file.filepath, sanitizedName, file.mimetype)
      processedFile.metadata = metadata
      processedFile.hash = metadata.hash
    }

    logger.info(`Processed image: ${sanitizedName}`)
    return processedFile
  }

  private async processPdf(file: any, sanitizedName: string, uploadId: string): Promise<ProcessedFile> {
    const logger = getLogger()

    if (this.config.enableProgressTracking) {
      this.progressTracker.setStatus(uploadId, "processing")
    }

    const filename = `${uuidv4()}.pdf`
    const outputPath = path.join(this.config.docsDir, filename)

    // Copy PDF to docs directory
    const fs = await import("fs")
    await fs.promises.copyFile(file.filepath, outputPath)

    const finalUrl = `/${path.relative("public", outputPath).replace(/\\/g, "/")}`

    const processedFile: ProcessedFile = {
      url: finalUrl,
      originalName: sanitizedName,
      size: file.size,
      type: file.mimetype,
    }

    // Extract metadata if enabled
    if (this.config.enableMetadata) {
      const metadata = await this.metadataExtractor.extractMetadata(outputPath, sanitizedName, file.mimetype)
      processedFile.metadata = metadata
      processedFile.hash = metadata.hash
    }

    logger.info(`Processed PDF: ${sanitizedName}`)
    return processedFile
  }

  async parseRequest(req: NextApiRequest): Promise<{ fields: any; files: any }> {
    const form = formidable({
      maxFileSize: this.config.maxFileSize,
      keepExtensions: true,
    })

    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })
  }

  async deleteFile(filePath: string): Promise<void> {
    const logger = getLogger()

    if (!filePath || !filePath.startsWith("/")) {
      throw new Error("Invalid file path")
    }

    const exists = await fileExists(filePath)
    if (!exists) {
      throw new Error("File not found")
    }

    await deleteFile(filePath)

    // Also delete thumbnails if they exist
    if (this.config.generateThumbnails) {
      const basePath = filePath.replace(/\.[^/.]+$/, "")
      const thumbnailPaths = [`${basePath}_thumb.webp`, `${basePath}_medium.webp`, `${basePath}_large.webp`]

      for (const thumbPath of thumbnailPaths) {
        try {
          if (await fileExists(thumbPath)) {
            await deleteFile(thumbPath)
          }
        } catch (error) {
          // Ignore thumbnail deletion errors
          logger.warn(`Failed to delete thumbnail: ${thumbPath}`)
        }
      }
    }

    logger.info(`File deleted: ${filePath}`)
  }

  async updateFile(req: NextApiRequest, oldFilePath?: string): Promise<ProcessedFile[]> {
    const logger = getLogger()

    try {
      // Delete old file if provided
      if (oldFilePath) {
        try {
          await this.deleteFile(oldFilePath)
        } catch (error) {
          logger.warn(`Failed to delete old file: ${oldFilePath}`, error)
        }
      }

      // Upload new file
      const processedFiles = await this.uploadFiles(req)
      logger.info(`File updated successfully`)

      return processedFiles
    } catch (error) {
      logger.error("File update failed", error)
      throw error
    }
  }
}
