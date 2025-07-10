import type { NextApiRequest, NextApiResponse } from "next"
import { EnhancedFileHandler } from "../core/enhancedFileHandler"
import type { UploadConfig, UploadResponse } from "../types"
import { initLogger } from "../utils/logger"

export const createEnhancedUploadHandler = (config: UploadConfig = {}) => {
  // Initialize logger
  initLogger(config)

  const fileHandler = new EnhancedFileHandler(config)

  return async (req: NextApiRequest, res: NextApiResponse<UploadResponse>) => {
    // Set CORS headers if configured
    if (config.corsOrigins) {
      const origin = req.headers.origin
      if (origin && config.corsOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin)
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
      }
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end()
    }

    try {
      switch (req.method) {
        case "POST":
          const uploadedFiles = await fileHandler.uploadFiles(req)

          const uploadResponse = uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles

          return res.status(200).json({
            success: true,
            data: uploadResponse,
          })

        case "DELETE":
          const { filePath } = req.body

          if (!filePath) {
            return res.status(400).json({
              success: false,
              error: "File path is required",
            })
          }

          await fileHandler.deleteFile(filePath)

          return res.status(200).json({
            success: true,
            message: "File deleted successfully",
          })

        case "PUT":
          const { oldFilePath } = req.body
          const updatedFiles = await fileHandler.updateFile(req, oldFilePath)

          const updateResponse = updatedFiles.length === 1 ? updatedFiles[0] : updatedFiles

          return res.status(200).json({
            success: true,
            data: updateResponse,
          })

        default:
          return res.status(405).json({
            success: false,
            error: "Method not allowed",
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      // Handle specific error types
      if (errorMessage.includes("Authentication failed")) {
        return res.status(401).json({
          success: false,
          error: errorMessage,
        })
      }

      if (errorMessage.includes("Rate limit exceeded")) {
        return res.status(429).json({
          success: false,
          error: errorMessage,
        })
      }

      return res.status(500).json({
        success: false,
        error: errorMessage,
      })
    }
  }
}

// Export configuration for Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
}
