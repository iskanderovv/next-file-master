import winston from "winston"
import type { UploadConfig } from "../types"

let logger: winston.Logger

export const initLogger = (config: UploadConfig) => {
  if (!config.enableLogging) {
    logger = winston.createLogger({
      silent: true,
    })
    return logger
  }

  logger = winston.createLogger({
    level: config.logLevel || "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ],
  })

  return logger
}

export const getLogger = () => {
  if (!logger) {
    throw new Error("Logger not initialized. Call initLogger first.")
  }
  return logger
}
