import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image } from '@/types'
import { Button } from '@/components/ui/button'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface ImageGalleryProps {
  images: Image[]
  initialImageIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function ImageGallery({
  images,
  initialImageIndex = 0,
  isOpen,
  onClose,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex)

  // Reset the index when the images change
  useEffect(() => {
    setCurrentIndex(initialImageIndex)
  }, [initialImageIndex, images])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentIndex, images.length])

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    )
  }

  if (!isOpen || images.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center'
          onClick={onClose}
        >
          {/* Content container that prevents propagation */}
          <motion.div
            className='relative max-w-[90vw] max-h-[90vh] flex items-center justify-center'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-4 right-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70'
              onClick={onClose}
            >
              <XMarkIcon className='h-6 w-6' />
            </Button>

            {/* Image */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='max-w-full max-h-[80vh] flex items-center justify-center'
            >
              <img
                src={images[currentIndex].url}
                alt={
                  images[currentIndex].alt_text || `Image ${currentIndex + 1}`
                }
                className='max-w-full max-h-[80vh] object-contain'
              />
            </motion.div>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute left-4 rounded-full bg-black/50 text-white hover:bg-black/70'
                  onClick={handlePrev}
                >
                  <ChevronLeftIcon className='h-6 w-6' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-4 rounded-full bg-black/50 text-white hover:bg-black/70'
                  onClick={handleNext}
                >
                  <ChevronRightIcon className='h-6 w-6' />
                </Button>
              </>
            )}

            {/* Image counter */}
            <div className='absolute bottom-4 left-0 right-0 text-center text-white'>
              <span className='px-3 py-1 bg-black/50 rounded-full text-sm'>
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
