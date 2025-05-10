import imageCompression from 'browser-image-compression'

// Configuration for avatar image compression
export const AVATAR_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // Maximum size in MB
  maxWidthOrHeight: 512, // Maximum width or height in pixels
  useWebWorker: true, // Use web worker for better performance
  initialQuality: 0.8, // Initial quality (0 to 1)
}

/**
 * Compresses an image file with optimal settings for avatars
 */
export async function compressImage(
  file: File,
  options = AVATAR_COMPRESSION_OPTIONS
): Promise<File> {
  try {
    // Compress the image
    const compressedFile = await imageCompression(file, options)

    // Create a new file with the original name but compressed content
    return new File([compressedFile], file.name, {
      type: getOptimalImageType(file),
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error('Error compressing image:', error)
    // Return the original file if compression fails
    return file
  }
}

/**
 * Determines the optimal image type based on browser support
 */
function getOptimalImageType(file: File): string {
  // Check if the browser supports WebP
  const supportsWebP =
    typeof window !== 'undefined' &&
    'createImageBitmap' in window &&
    typeof ImageBitmap !== 'undefined' &&
    typeof ImageBitmap.prototype.close === 'function'

  // If WebP is supported and the original isn't already WebP or PNG, use WebP
  if (
    supportsWebP &&
    !file.type.includes('webp') &&
    !file.type.includes('png')
  ) {
    return 'image/webp'
  }

  // Otherwise, use JPEG for photos or the original type
  return file.type.includes('png') ? 'image/png' : 'image/jpeg'
}

/**
 * Creates a file from a blob with a specified name
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
  })
}

/**
 * Get image dimensions (width and height)
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = URL.createObjectURL(file)
  })
}
