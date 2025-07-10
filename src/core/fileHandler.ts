import formidable from "formidable"
import type { NextApiRequest } from "next"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import type { UploadConfig, ProcessedFile } from "../types"
import { defaultConfig } from "../config/default"
import { ensureDirectoryExists, deleteFile, fileExists } from "../utils/fileSystem"
import { validateFile, sanitizeFilename, isImageFile, isPdfFile } from "../utils/validation"
import { processImage } from "../utils/imageProcessor"
import { getLogger } from "../utils/logger"

export class FileHandler {
  private config: Required<UploadConfig>

  constructor(config: UploadConfig = {}) {
    this.config = { ...defaultConfig, ...config }
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

  async uploadFiles(req: NextApiRequest): Promise<ProcessedFile[]> {
    const logger = getLogger()

    try {
      // Ensure directories exist
      await ensureDirectoryExists(this.config.uploadDir)
      await ensureDirectoryExists(this.config.docsDir)

      const { files } = await this.parseRequest(req)
      const fileArray = Array.isArray(files.file) ? files.file : [files.file]

      const processedFiles: ProcessedFile[] = []

      for (const file of fileArray) {
        if (!file) continue

        // Validate file
        const validation = validateFile(file, this.config)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }

        let finalPath: string
        const sanitizedName = sanitizeFilename(file.originalFilename || "unknown")

        if (isImageFile(file.mimetype, this.config)) {
          // Process image and convert to WebP
          finalPath = await processImage(file.filepath, this.config.uploadDir, this.config)
        } else if (isPdfFile(file.mimetype)) {
          // Handle PDF files
          const filename = `${uuidv4()}.pdf`
          const outputPath = path.join(this.config.docsDir, filename)

          // Move PDF to docs directory
          const fs = await import("fs")
          await fs.promises.copyFile(file.filepath, outputPath)

          finalPath = `/${path.relative("public", outputPath).replace(/\\/g, "/")}`
          logger.info(`Saved PDF: ${filename}`)
        } else {
          throw new Error(`Unsupported file type: ${file.mimetype}`)
        }

        processedFiles.push({
          url: finalPath,
          size: file.size,
          type: isImageFile(file.mimetype, this.config) ? "image/webp" : file.mimetype,
          originalName: sanitizedName,
        })
      }

      logger.info(`Successfully processed ${processedFiles.length} files`)
      return processedFiles
    } catch (error) {
      logger.error("File upload failed", error)
      throw error
    }
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
