import { validateFile, sanitizeFilename, isImageFile, isPdfFile } from "../utils/validation"

describe("Validation Utils", () => {
  describe("validateFile", () => {
    it("should validate file size", () => {
      const file = {
        size: 15 * 1024 * 1024, // 15MB
        mimetype: "image/jpeg",
      }

      const result = validateFile(file, { maxFileSize: 10 * 1024 * 1024 })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain("File size exceeds")
    })

    it("should validate MIME type", () => {
      const file = {
        size: 1024,
        mimetype: "text/plain",
      }

      const result = validateFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain("Unsupported file type")
    })

    it("should pass valid file", () => {
      const file = {
        size: 1024,
        mimetype: "image/jpeg",
      }

      const result = validateFile(file)
      expect(result.isValid).toBe(true)
    })
  })

  describe("sanitizeFilename", () => {
    it("should sanitize dangerous characters", () => {
      const filename = "../../../etc/passwd"
      const sanitized = sanitizeFilename(filename)
      expect(sanitized).toBe("___etc_passwd")
    })

    it("should preserve valid characters", () => {
      const filename = "image-123.jpg"
      const sanitized = sanitizeFilename(filename)
      expect(sanitized).toBe("image-123.jpg")
    })
  })

  describe("isImageFile", () => {
    it("should identify image files", () => {
      expect(isImageFile("image/jpeg")).toBe(true)
      expect(isImageFile("image/png")).toBe(true)
      expect(isImageFile("application/pdf")).toBe(false)
    })
  })

  describe("isPdfFile", () => {
    it("should identify PDF files", () => {
      expect(isPdfFile("application/pdf")).toBe(true)
      expect(isPdfFile("image/jpeg")).toBe(false)
    })
  })
})
