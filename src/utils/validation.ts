import type { ValidationResult, UploadConfig } from "../types"
import { defaultConfig } from "../config/default"

export const validateFile = (file: any, config: UploadConfig = {}): ValidationResult => {
  const mergedConfig = { ...defaultConfig, ...config }

  // Check file size
  if (file.size > mergedConfig.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${mergedConfig.maxFileSize / (1024 * 1024)}MB`,
    }
  }

  // Check MIME type
  const supportedTypes = [...mergedConfig.supportedImageTypes, ...mergedConfig.supportedDocTypes]

  if (!supportedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.mimetype}. Supported types: ${supportedTypes.join(", ")}`,
    }
  }

  return { isValid: true }
}

export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
}

export const isImageFile = (mimeType: string, config: UploadConfig = {}): boolean => {
  const mergedConfig = { ...defaultConfig, ...config }
  return mergedConfig.supportedImageTypes.includes(mimeType)
}

export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === "application/pdf"
}
