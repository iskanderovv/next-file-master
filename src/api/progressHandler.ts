import type { NextApiRequest, NextApiResponse } from "next"
import { ProgressTracker } from "../utils/progressTracker"

export const createProgressHandler = () => {
  const progressTracker = ProgressTracker.getInstance()

  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "GET") {
      const { uploadId } = req.query

      if (uploadId && typeof uploadId === "string") {
        // Get specific upload progress
        const progress = progressTracker.getProgress(uploadId)
        if (progress) {
          return res.status(200).json(progress)
        } else {
          return res.status(404).json({ error: "Upload not found" })
        }
      } else {
        // Get all progress
        const allProgress = progressTracker.getAllProgress()
        return res.status(200).json(allProgress)
      }
    } else {
      return res.status(405).json({ error: "Method not allowed" })
    }
  }
}
