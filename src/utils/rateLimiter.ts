import type { NextApiRequest } from "next"

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextApiRequest) => string
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      ...config,
    }
  }

  async checkLimit(req: NextApiRequest): Promise<{ allowed: boolean; resetTime?: number }> {
    const key = this.config.keyGenerator!(req)
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get existing requests for this key
    let requests = this.requests.get(key) || []

    // Remove old requests outside the window
    requests = requests.filter((timestamp) => timestamp > windowStart)

    // Check if limit exceeded
    if (requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...requests)
      const resetTime = oldestRequest + this.config.windowMs
      return { allowed: false, resetTime }
    }

    // Add current request
    requests.push(now)
    this.requests.set(key, requests)

    return { allowed: true }
  }

  private getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers["x-forwarded-for"]
    const ip = forwarded
      ? Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(",")[0]
      : req.socket.remoteAddress

    return ip || "unknown"
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter((timestamp) => timestamp > windowStart)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}
