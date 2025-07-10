export interface UploadProgress {
  uploadId: string
  filename: string
  totalSize: number
  uploadedSize: number
  percentage: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
}

export class ProgressTracker {
  private static instance: ProgressTracker
  private progressMap: Map<string, UploadProgress> = new Map()

  static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker()
    }
    return ProgressTracker.instance
  }

  createProgress(uploadId: string, filename: string, totalSize: number): void {
    this.progressMap.set(uploadId, {
      uploadId,
      filename,
      totalSize,
      uploadedSize: 0,
      percentage: 0,
      status: "uploading",
    })
  }

  updateProgress(uploadId: string, uploadedSize: number): void {
    const progress = this.progressMap.get(uploadId)
    if (progress) {
      progress.uploadedSize = uploadedSize
      progress.percentage = Math.round((uploadedSize / progress.totalSize) * 100)
      this.progressMap.set(uploadId, progress)
    }
  }

  setStatus(uploadId: string, status: UploadProgress["status"], error?: string): void {
    const progress = this.progressMap.get(uploadId)
    if (progress) {
      progress.status = status
      if (error) progress.error = error
      this.progressMap.set(uploadId, progress)
    }
  }

  getProgress(uploadId: string): UploadProgress | undefined {
    return this.progressMap.get(uploadId)
  }

  removeProgress(uploadId: string): void {
    this.progressMap.delete(uploadId)
  }

  getAllProgress(): UploadProgress[] {
    return Array.from(this.progressMap.values())
  }
}
