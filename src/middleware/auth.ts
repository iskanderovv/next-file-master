import type { NextApiRequest } from "next"

export interface AuthConfig {
  enabled: boolean
  jwtSecret?: string
  apiKey?: string
  customValidator?: (req: NextApiRequest) => Promise<boolean> | boolean
}

export class AuthMiddleware {
  private config: AuthConfig

  constructor(config: AuthConfig) {
    this.config = config
  }

  async validateRequest(req: NextApiRequest): Promise<{ isValid: boolean; error?: string }> {
    if (!this.config.enabled) {
      return { isValid: true }
    }

    // Custom validator
    if (this.config.customValidator) {
      try {
        const isValid = await this.config.customValidator(req)
        return { isValid }
      } catch (error) {
        return { isValid: false, error: "Authentication failed" }
      }
    }

    // API Key validation
    if (this.config.apiKey) {
      const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "")
      if (apiKey !== this.config.apiKey) {
        return { isValid: false, error: "Invalid API key" }
      }
    }

    // JWT validation
    if (this.config.jwtSecret) {
      const token = req.headers["authorization"]?.replace("Bearer ", "")
      if (!token) {
        return { isValid: false, error: "No token provided" }
      }

      try {
        // Simple JWT validation (in production, use a proper JWT library)
        const [header, payload, signature] = token.split(".")
        if (!header || !payload || !signature) {
          return { isValid: false, error: "Invalid token format" }
        }
        // Add proper JWT verification here
        return { isValid: true }
      } catch (error) {
        return { isValid: false, error: "Invalid token" }
      }
    }

    return { isValid: true }
  }
}
