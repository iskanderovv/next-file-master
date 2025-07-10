import sharp from "sharp"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import type { UploadConfig, ImageSizes } from "../types"
import { getCompleteConfig } from "../config/default"
import { getLogger } from "./logger"

export interface OptimizedImages {
  original: string
  thumbnail?: string
  medium?: string
  large?: string
}

export class ImageOptimizer {
  private config: Required<UploadConfig>

  constructor(config: UploadConfig) {
    this.config = getCompleteConfig(config)
  }

  async generateMultipleSizes(inputPath: string, outputDir: string, sizes: ImageSizes = {}): Promise<OptimizedImages> {
    const logger = getLogger()
    const baseId = uuidv4()
    const results: OptimizedImages = {
      original: "",
    }

    try {
      // Original WebP
      const originalFilename = `${baseId}.webp`
      const originalPath = path.join(outputDir, originalFilename)
      await sharp(inputPath).webp({ quality: this.config.webpQuality }).toFile(originalPath)
      results.original = `/${path.relative("public", originalPath).replace(/\\/g, "/")}`

      // Generate thumbnails if requested
      if (sizes.thumbnail) {
        const thumbFilename = `${baseId}_thumb.webp`
        const thumbPath = path.join(outputDir, thumbFilename)
        await sharp(inputPath)
          .resize(sizes.thumbnail.width, sizes.thumbnail.height, { fit: "cover" })
          .webp({ quality: this.config.webpQuality })
          .toFile(thumbPath)
        results.thumbnail = `/${path.relative("public", thumbPath).replace(/\\/g, "/")}`
      }

      // Generate medium size if requested
      if (sizes.medium) {
        const mediumFilename = `${baseId}_medium.webp`
        const mediumPath = path.join(outputDir, mediumFilename)
        await sharp(inputPath)
          .resize(sizes.medium.width, sizes.medium.height, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: this.config.webpQuality })
          .toFile(mediumPath)
        results.medium = `/${path.relative("public", mediumPath).replace(/\\/g, "/")}`
      }

      // Generate large size if requested
      if (sizes.large) {
        const largeFilename = `${baseId}_large.webp`
        const largePath = path.join(outputDir, largeFilename)
        await sharp(inputPath)
          .resize(sizes.large.width, sizes.large.height, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: this.config.webpQuality })
          .toFile(largePath)
        results.large = `/${path.relative("public", largePath).replace(/\\/g, "/")}`
      }

      logger.info(`Generated multiple image sizes for: ${baseId}`)
      return results
    } catch (error) {
      logger.error("Failed to generate multiple image sizes", error)
      throw new Error("Failed to optimize images")
    }
  }
}
