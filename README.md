# next-file-master

A comprehensive, production-ready file upload package for Next.js applications with advanced features including authentication, rate limiting, progress tracking, thumbnail generation, and metadata extraction.

## 🚀 Features

- 📁 **File Upload**: Single and multiple file uploads
- 🖼️ **Image Processing**: Automatic WebP conversion with multiple sizes
- 📄 **PDF Support**: Handle PDF uploads with validation
- 🔐 **Authentication**: JWT, API Key, and custom authentication
- ⚡ **Rate Limiting**: Prevent abuse with configurable limits
- 📊 **Progress Tracking**: Real-time upload progress monitoring
- 🖼️ **Thumbnails**: Automatic thumbnail generation (small, medium, large)
- 📋 **Metadata**: File hash, dimensions, and comprehensive metadata
- 🔒 **Security**: File validation, sanitization, and size limits
- 📁 **Auto Directory**: Automatically creates upload directories
- 🔄 **CRUD Operations**: Complete Create, Read, Update, Delete support
- 📝 **TypeScript**: Full type safety and IntelliSense support
- 🪵 **Logging**: Comprehensive logging with Winston
- 🌐 **CORS**: Cross-origin request support
- ⚡ **Performance**: Stream processing for large files

## 📦 Installation

```bash
npm install next-file-master
# or
yarn add next-file-master
# or
pnpm add next-file-master
```


## 🚀 Quick Start

### Basic Setup

```typescript
// pages/api/upload.ts
import { createUploadHandler, config } from 'next-file-master';

export default createUploadHandler({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  webpQuality: 80,
  enableLogging: true
});

export { config };
```


### Enhanced Setup (Recommended)

```typescript
// pages/api/upload.ts
import { createEnhancedUploadHandler, config } from 'next-file-master';

export default createEnhancedUploadHandler({
  maxFileSize: 10 * 1024 * 1024,
  webpQuality: 85,

  // Generate thumbnails
  generateThumbnails: true,
  imageSizes: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 500, height: 500 },
    large: { width: 1200, height: 1200 }
  },

  // Enable advanced features
  enableMetadata: true,
  enableProgressTracking: true,

  // Authentication
  auth: {
    enabled: true,
    apiKey: process.env.UPLOAD_API_KEY, // Set in .env.local
  },

  // Rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 uploads per 15 minutes
  },

  // CORS
  corsOrigins: ['http://localhost:3000', 'https://yourdomain.com'],

  enableLogging: true,
  logLevel: 'info'
});

export { config };
```

### Progress Tracking API

```typescript
// pages/api/upload-progress.ts
import { createProgressHandler } from 'next-file-master';

export default createProgressHandler();
```


## 💻 Frontend Examples

### Basic Upload Component

```jsx
// components/FileUpload.jsx
import { useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': 'your-api-key',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        console.log('Upload result:', data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4 w-full"
      />
      
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {error && <div className="text-red-500 mt-2">{error}</div>}
      
      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <h3 className="font-bold">Upload Successful!</h3>
          <p><strong>File:</strong> {result.originalName}</p>
          <p><strong>Size:</strong> {(result.size / 1024).toFixed(1)} KB</p>
          <p><strong>Type:</strong> {result.type}</p>
          {result.metadata?.dimensions && (
            <p><strong>Dimensions:</strong> {result.metadata.dimensions.width}x{result.metadata.dimensions.height}</p>
          )}
          
          <div className="mt-3 space-x-2">
            <a href={result.url} target="_blank" className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              View Original
            </a>
            {result.thumbnails?.thumbnail && (
              <a href={result.thumbnails.thumbnail} target="_blank" className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                View Thumbnail
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Upload with Progress Tracking

```jsx
// components/ProgressUpload.jsx
import { useState, useEffect } from 'react';

export default function ProgressUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setProgress(null);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!uploading) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/upload-progress');
        const progressData = await response.json();
        
        if (Array.isArray(progressData) && progressData.length > 0) {
          const latestProgress = progressData[progressData.length - 1];
          setProgress(latestProgress);
          
          if (latestProgress.status === 'completed' || latestProgress.status === 'error') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [uploading]);

  return (
    <div className="max-w-md mx-auto p-6">
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4 w-full"
      />
      
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span>{progress.filename}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Status: {progress.status}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <h3 className="font-bold">Upload Complete!</h3>
          <p>File: {result.originalName}</p>
          <a href={result.url} target="_blank" className="text-blue-500 underline">
            View File
          </a>
        </div>
      )}
    </div>
  );
}
```


### Drag & Drop with Thumbnails

```jsx
// components/DragDropUpload.jsx
import { useState, useCallback } from 'react';

export default function DragDropUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  }, []);

  const uploadFile = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Uploading and processing...</p>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg font-medium mb-2">Drop your file here</p>
            <p className="text-gray-500">Images will be converted to WebP with thumbnails</p>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-4">Upload Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">File Info</h4>
              <p><strong>Name:</strong> {result.originalName}</p>
              <p><strong>Size:</strong> {(result.size / 1024).toFixed(1)} KB</p>
              <p><strong>Type:</strong> {result.type}</p>
              {result.metadata?.dimensions && (
                <p><strong>Dimensions:</strong> {result.metadata.dimensions.width}x{result.metadata.dimensions.height}</p>
              )}
            </div>
            
            {result.thumbnails && (
              <div>
                <h4 className="font-semibold mb-2">Generated Sizes</h4>
                <div className="space-y-2">
                  <a href={result.url} target="_blank" className="block text-blue-500 hover:underline">
                    📄 Original
                  </a>
                  {result.thumbnails.thumbnail && (
                    <a href={result.thumbnails.thumbnail} target="_blank" className="block text-blue-500 hover:underline">
                      🖼️ Thumbnail (150x150)
                    </a>
                  )}
                  {result.thumbnails.medium && (
                    <a href={result.thumbnails.medium} target="_blank" className="block text-blue-500 hover:underline">
                      🖼️ Medium (500x500)
                    </a>
                  )}
                  {result.thumbnails.large && (
                    <a href={result.thumbnails.large} target="_blank" className="block text-blue-500 hover:underline">
                      🖼️ Large (1200x1200)
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🧪 API Testing with Postman

### 1. Upload with Authentication (POST)

**Request Setup:**
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/upload`
- **Headers:**
  - `X-API-Key`: `your-secret-api-key`
- **Body:** 
  - Select `form-data`
  - Add key: `file` (type: `File`)
  - Select your image or PDF file

**Response (Enhanced):**

```json
{
  "success": true,
  "data": {
    "url": "/uploads/abc123-def456.webp",
    "size": 245760,
    "type": "image/webp",
    "originalName": "photo.jpg",
    "hash": "sha256:a1b2c3d4e5f6...",
    "metadata": {
      "filename": "abc123-def456.webp",
      "originalName": "photo.jpg",
      "size": 245760,
      "mimeType": "image/webp",
      "hash": "sha256:a1b2c3d4e5f6...",
      "uploadedAt": "2024-01-10T10:30:00.000Z",
      "dimensions": {
        "width": 1920,
        "height": 1080
      }
    },
    "thumbnails": {
      "thumbnail": "/uploads/abc123-def456_thumb.webp",
      "medium": "/uploads/abc123-def456_medium.webp",
      "large": "/uploads/abc123-def456_large.webp"
    }
  }
}
```

### 2. Check Upload Progress (GET)

```json
[
  {
    "uploadId": "upload-123",
    "filename": "photo.jpg",
    "totalSize": 1048576,
    "uploadedSize": 524288,
    "percentage": 50,
    "status": "uploading"
  }
]
```

### 3. Rate Limit Error (429)

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

### 4. Authentication Error (401)

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

## ⚙️ Configuration Options

```typescript
interface UploadConfig {
  uploadDir?: string;
  docsDir?: string;
  maxFileSize?: number;
  webpQuality?: number;

  supportedImageTypes?: string[];
  supportedDocTypes?: string[];

  generateThumbnails?: boolean;
  imageSizes?: {
    thumbnail?: { width: number; height: number };
    medium?: { width: number; height: number };
    large?: { width: number; height: number };
  };

  enableMetadata?: boolean;
  enableProgressTracking?: boolean;

  auth?: {
    enabled: boolean;
    jwtSecret?: string;
    apiKey?: string;
    customValidator?: (req: NextApiRequest) => Promise<boolean> | boolean;
  };

  rateLimiting?: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: NextApiRequest) => string;
  };

  corsOrigins?: string[];
  enableLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
```

## 🔐 Authentication Examples

### API Key Authentication

```typescript
// .env.local
UPLOAD_API_KEY=your-super-secret-api-key

// pages/api/upload.ts
export default createEnhancedUploadHandler({
  auth: {
    enabled: true,
    apiKey: process.env.UPLOAD_API_KEY,
  }
});
```

### JWT Authentication

```typescript
export default createEnhancedUploadHandler({
  auth: {
    enabled: true,
    jwtSecret: process.env.JWT_SECRET,
  }
});
```

### Custom Authentication

```typescript
export default createEnhancedUploadHandler({
  auth: {
    enabled: true,
    customValidator: async (req) => {
      // Your custom auth logic
      const userId = req.headers['x-user-id'];
      const isValid = await validateUser(userId);
      return isValid;
    }
  }
});
```

---

## 📊 Rate Limiting Examples

### Basic Rate Limiting

```typescript
export default createEnhancedUploadHandler({
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,         // 100 uploads per 15 minutes
  }
});
```

### Custom Rate Limiting

```typescript
export default createEnhancedUploadHandler({
  rateLimiting: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 uploads per minute
    keyGenerator: (req) => {
      // Rate limit by user ID instead of IP
      return req.headers['x-user-id'] || 'anonymous';
    }
  }
});
```

---

## 🖼️ Image Processing Examples

### Multiple Thumbnail Sizes

```typescript
export default createEnhancedUploadHandler({
  generateThumbnails: true,
  imageSizes: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 500, height: 500 },
    large: { width: 1200, height: 1200 }
  },
  webpQuality: 85,
});
```

### Custom Image Sizes

```typescript
export default createEnhancedUploadHandler({
  generateThumbnails: true,
  imageSizes: {
    thumbnail: { width: 100, height: 100 },
    medium: { width: 800, height: 600 },
    large: { width: 1920, height: 1080 }
  }
});
```

---

## 🔍 Error Handling

### Frontend Error Handling

```javascript
try {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    switch (response.status) {
      case 401:
        alert('Authentication failed. Please check your API key.');
        break;
      case 429:
        alert('Too many uploads. Please wait before trying again.');
        break;
      case 413:
        alert('File too large. Please choose a smaller file.');
        break;
      default:
        alert(`Upload failed: ${result.error}`);
    }
    return;
  }

  console.log('Upload successful:', result.data);
} catch (error) {
  alert('Network error. Please check your connection.');
}
```

### Common Error Responses

```json
// File too large
{
  "success": false,
  "error": "File size exceeds maximum allowed size of 10MB"
}

// Authentication failed
{
  "success": false,
  "error": "Invalid API key"
}

// Rate limit exceeded
{
  "success": false,
  "error": "Rate limit exceeded"
}

// Unsupported file type
{
  "success": false,
  "error": "Unsupported file type: text/plain"
}
```

---

## 📁 File Structure

```txt
your-nextjs-project/
├── pages/api/
│   ├── upload.ts              # Main upload endpoint
│   └── upload-progress.ts     # Progress tracking endpoint
├── public/
│   ├── uploads/               # Images with thumbnails
│   │   ├── abc123.webp         # Original
│   │   ├── abc123_thumb.webp   # Thumbnail
│   │   ├── abc123_medium.webp  # Medium
│   │   └── abc123_large.webp   # Large
│   └── docs/                  # PDF documents
│       └── doc123.pdf
├── components/
│   ├── FileUpload.jsx
│   ├── ProgressUpload.jsx
│   └── DragDropUpload.jsx
└── .env.local
    ├── UPLOAD_API_KEY=your-secret-key
    └── JWT_SECRET=your-jwt-secret
```


## 🔧 Troubleshooting

### Common Issues

1. **Authentication errors**
   - Verify your API key in `.env.local`
   - Check that headers are being sent correctly
   - Ensure the auth configuration matches your setup

2. **Rate limiting issues**
   - Check your rate limit configuration
   - Monitor the rate limit window and request count
   - Consider implementing user-specific rate limiting

3. **Thumbnail generation fails**
   - Ensure Sharp is properly installed: `npm install sharp`
   - Check that the image is a valid format
   - Verify write permissions to the upload directory

4. **Progress tracking not working**
   - Make sure `enableProgressTracking: true` is set
   - Check that the progress API endpoint is created
   - Verify polling interval in frontend code

5. **Large file uploads failing**
   - Increase `maxFileSize` in configuration
   - Check server upload limits (Vercel: 4.5MB for serverless)
   - Consider implementing chunked uploads for very large files

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📧 Email: iskandarov_a@nuu.uz
- 🐛 Issues: [GitHub Issues](https://github.com/iskanderovv/next-file-master/issues)
<!-- - 📖 Documentation: [Full Documentation](https://next-file-master.com/docs) -->
- 💬 Discussions: [GitHub Discussions](https://github.com/iskanderovv/next-file-master/discussions)
