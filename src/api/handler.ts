import type { NextApiRequest, NextApiResponse } from "next"
import { FileHandler } from "../core/fileHandler"
import type { UploadConfig, UploadResponse } from "../types"
import { initLogger } from "../utils/logger"

export const createUploadHandler = (config: UploadConfig = {}) => {
  // Initialize logger
  initLogger(config)

  const fileHandler = new FileHandler(config)

  return async (req: NextApiRequest, res: NextApiResponse<UploadResponse>) => {
    // Disable Next.js body parser for file uploads
    if (req.method === "POST" || req.method === "PUT") {
      // This should be handled in the API route configuration
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
