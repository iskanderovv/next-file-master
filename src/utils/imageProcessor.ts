import sharp from "sharp"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import type { UploadConfig } from "../types"
import { defaultConfig } from "../config/default"
import { getLogger } from "./logger"

export const processImage = async (
  inputPath: string,
  outputDir: string,
  config: UploadConfig = {},
): Promise<string> => {
  const logger = getLogger()
  const mergedConfig = { ...defaultConfig, ...config }

  try {
    const filename = `${uuidv4()}.webp`
    const outputPath = path.join(outputDir, filename)

    await sharp(inputPath).webp({ quality: mergedConfig.webpQuality }).toFile(outputPath)

    logger.info(`Converted image to WebP: ${filename}`)
    return `/${path.relative("public", outputPath).replace(/\\/g, "/")}`
  } catch (error) {
    logger.error("Failed to process image", error)
    throw new Error("Failed to process image")
  }
}
