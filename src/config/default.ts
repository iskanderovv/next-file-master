import type { UploadConfig } from "../types"

export const defaultConfig: Required<UploadConfig> = {
  uploadDir: "public/uploads",
  docsDir: "public/docs",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  webpQuality: 80,
  supportedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"],
  supportedDocTypes: ["application/pdf"],
  enableLogging: true,
  logLevel: "info",
}
