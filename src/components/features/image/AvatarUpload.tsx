import React, { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ImageCropModal } from './ImageCropModal'
import { compressImage, blobToFile } from '@/utils/imageUtils'
import { UserIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AvatarUploadProps {
  onChange: (file: File | null) => void
  defaultImageUrl?: string
  disabled?: boolean
}

export function AvatarUpload({
  onChange,
  defaultImageUrl,
  disabled = false,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultImageUrl || null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasBeenRemoved, setHasBeenRemoved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize preview with defaultImageUrl if provided
  useEffect(() => {
    // Only update preview from defaultImageUrl if we haven't explicitly removed an avatar
    if (defaultImageUrl && !hasBeenRemoved) {
      setPreview(defaultImageUrl)
    } else if (!defaultImageUrl && !hasBeenRemoved) {
      setPreview(null)
    }
  }, [defaultImageUrl, hasBeenRemoved])

  // Reset hasBeenRemoved flag when defaultImageUrl changes completely
  // This helps when switching between different users in edit mode
  useEffect(() => {
    setHasBeenRemoved(false)
  }, [defaultImageUrl])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    if (file) {
      setHasBeenRemoved(false)
      setOriginalFile(file)

      // Create a temporary URL for the crop modal
      const tempSrc = URL.createObjectURL(file)
      setTempImageSrc(tempSrc)

      // Open the crop modal
      setIsCropModalOpen(true)
    } else {
      resetState()
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!originalFile) return

    try {
      setIsProcessing(true)

      // Convert blob to file
      const croppedFile = blobToFile(croppedBlob, originalFile.name)

      // Compress the cropped image
      const compressedFile = await compressImage(croppedFile)

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)

      // Send the processed file to parent component
      onChange(compressedFile)
    } catch (error) {
      console.error('Error processing image:', error)
      resetState()
    } finally {
      setIsProcessing(false)

      // Clean up the temporary URL
      if (tempImageSrc) {
        URL.revokeObjectURL(tempImageSrc)
      }
    }
  }

  const resetState = () => {
    // Set preview to null AND mark that avatar was explicitly removed
    setPreview(null)
    setHasBeenRemoved(true)
    setOriginalFile(null)
    setTempImageSrc(null)

    // Call the onChange callback with null to indicate removal
    onChange(null)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    resetState()
  }

  return (
    <div className='flex flex-col items-center'>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        accept='image/*'
        className='hidden'
        disabled={disabled || isProcessing}
      />

      <div
        className='relative group cursor-pointer'
        onClick={handleButtonClick}
      >
        <Avatar className='h-24 w-24 border-2 border-dashed border-gray-300 group-hover:border-primary/70'>
          {preview ? (
            <AvatarImage src={preview} alt='Avatar preview' />
          ) : (
            <AvatarFallback className='bg-primary/10 text-primary text-2xl'>
              <div className='flex items-center justify-center w-full h-full'>
                {/* Default user icon */}
                <UserIcon className='h-12 w-12 text-primary/60' />
              </div>
            </AvatarFallback>
          )}
        </Avatar>

        {isProcessing && (
          <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center'>
            <svg
              className='animate-spin h-8 w-8 text-white'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
          </div>
        )}

        {!isProcessing && (
          <div className='absolute inset-0 bg-gray-900/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'>
            <CameraIcon className='h-8 w-8' />
          </div>
        )}

        {preview && !isProcessing && (
          <button
            type='button'
            onClick={handleRemove}
            className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          >
            <XMarkIcon className='h-4 w-4' />
          </button>
        )}
      </div>

      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='mt-2 text-xs'
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
      >
        {isProcessing
          ? 'Processing...'
          : preview
          ? 'Change avatar'
          : 'Upload avatar'}
      </Button>

      <p className='text-xs text-gray-500 mt-1 text-center max-w-[200px]'>
        Upload a square image for best results
      </p>

      {/* Image Crop Modal */}
      {tempImageSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          onOpenChange={setIsCropModalOpen}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1} // Square aspect ratio for avatars
        />
      )}
    </div>
  )
}
