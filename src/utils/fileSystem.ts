import fs from "fs"
import path from "path"
import { getLogger } from "./logger"

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  const logger = getLogger()

  try {
    await fs.promises.access(dirPath)
    logger.debug(`Directory already exists: ${dirPath}`)
  } catch (error) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true })
      logger.info(`Created directory: ${dirPath}`)
    } catch (mkdirError) {
      logger.error(`Failed to create directory: ${dirPath}`, mkdirError)
      throw new Error(`Failed to create directory: ${dirPath}`)
    }
  }
}

export const deleteFile = async (filePath: string): Promise<void> => {
  const logger = getLogger()

  try {
    const fullPath = path.join(process.cwd(), filePath)
    await fs.promises.access(fullPath)
    await fs.promises.unlink(fullPath)
    logger.info(`Deleted file: ${filePath}`)
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error)
    throw new Error(`Failed to delete file: ${filePath}`)
  }
}

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    await fs.promises.access(fullPath)
    return true
  } catch {
    return false
  }
}
