import fs from "fs"
import path from "path"
import crypto from "crypto"

export interface FileMetadata {
  filename: string
  originalName: string
  size: number
  mimeType: string
  hash: string
  uploadedAt: Date
  dimensions?: { width: number; height: number }
  duration?: number // for videos
}

export class MetadataExtractor {
  async extractMetadata(filePath: string, originalName: string, mimeType: string): Promise<FileMetadata> {
    const stats = await fs.promises.stat(filePath)
    const hash = await this.generateFileHash(filePath)

    const metadata: FileMetadata = {
      filename: path.basename(filePath),
      originalName,
      size: stats.size,
      mimeType,
      hash,
      uploadedAt: new Date(),
    }

    // Extract image dimensions if it's an image
    if (mimeType.startsWith("image/")) {
      try {
        const sharp = await import("sharp")
        const imageMetadata = await sharp.default(filePath).metadata()
        if (imageMetadata.width && imageMetadata.height) {
          metadata.dimensions = {
            width: imageMetadata.width,
            height: imageMetadata.height,
          }
        }
      } catch (error) {
        // Ignore metadata extraction errors
      }
    }

    return metadata
  }

  private async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256")
      const stream = fs.createReadStream(filePath)

      stream.on("data", (data) => hash.update(data))
      stream.on("end", () => resolve(hash.digest("hex")))
      stream.on("error", reject)
    })
  }
}
