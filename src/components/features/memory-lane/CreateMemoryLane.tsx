import { useState, FormEvent, ChangeEvent, useEffect, DragEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { memoryLaneService } from '@/services/memoryLaneService'
import { eventService } from '@/services/eventService'
import {
  ChevronLeftIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import { User } from '@/types'
import { motion } from 'framer-motion'

interface ImageFile {
  file: File
  preview: string
}

interface EventFormData {
  id: string
  title: string
  description: string
  date: string
  location: string
  images: ImageFile[]
}

interface CreateMemoryLaneProps {
  user: User
}

export function CreateMemoryLane({ user }: CreateMemoryLaneProps) {
  const navigate = useNavigate()
  const [laneTitle, setLaneTitle] = useState('')
  const [laneDescription, setLaneDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [coverImage, setCoverImage] = useState<ImageFile | null>(null)
  const [events, setEvents] = useState<EventFormData[]>([
    {
      id: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: '',
      description: '',
      date: '',
      location: '',
      images: [],
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)

  const addEvent = () => {
    // Generate a unique ID using timestamp + random number to avoid any collision
    const uniqueId = `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    setEvents([
      ...events,
      {
        id: uniqueId,
        title: '',
        description: '',
        date: '',
        location: '',
        images: [],
      },
    ])
  }

  const removeEvent = (id: string) => {
    if (events.length > 1) {
      setEvents(events.filter((event) => event.id !== id))
    }
  }

  const updateEvent = (
    id: string,
    field: keyof EventFormData,
    value: string | File[] | ImageFile[]
  ) => {
    setEvents(
      events.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      )
    )
  }

  const handleImageUpload = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles: ImageFile[] = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setEvents(
      events.map((event) => {
        if (event.id === id) {
          return {
            ...event,
            images: [...event.images, ...newFiles],
          }
        }
        return event
      })
    )
  }

  const handleImageDrop = (id: string, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setDragActive(null)

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    const newFiles: ImageFile[] = Array.from(e.dataTransfer.files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

    if (newFiles.length === 0) return

    setEvents(
      events.map((event) => {
        if (event.id === id) {
          return {
            ...event,
            images: [...event.images, ...newFiles],
          }
        }
        return event
      })
    )
  }

  const handleCoverImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    if (coverImage) {
      URL.revokeObjectURL(coverImage.preview)
    }

    const file = e.target.files[0]
    setCoverImage({
      file,
      preview: URL.createObjectURL(file),
    })
  }

  const handleCoverImageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setDragActive(null)

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    const file = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    )[0]

    if (!file) return

    if (coverImage) {
      URL.revokeObjectURL(coverImage.preview)
    }

    setCoverImage({
      file,
      preview: URL.createObjectURL(file),
    })
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (id: string, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(id)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)
  }

  const removeImage = (eventId: string, index: number) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          const newImages = [...event.images]
          // Release the object URL to avoid memory leaks
          URL.revokeObjectURL(newImages[index].preview)
          newImages.splice(index, 1)
          return {
            ...event,
            images: newImages,
          }
        }
        return event
      })
    )
  }

  const removeCoverImage = () => {
    if (coverImage) {
      URL.revokeObjectURL(coverImage.preview)
      setCoverImage(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate that each event has at least one image
    const eventsWithoutImages = events.filter(
      (event) => event.images.length === 0
    )
    if (eventsWithoutImages.length > 0) {
      const eventTitles = eventsWithoutImages
        .map((event) => event.title || `Event ${event.id}`)
        .join(', ')
      setError(
        `Please add at least one image for each event. Missing images for: ${eventTitles}`
      )
      return
    }

    setIsSubmitting(true)
    setError(null)
    setProgress(0)

    try {
      // 1. Create the memory lane
      setCurrentStep('Creating memory lane...')
      setProgress(10)
      const newLane = await memoryLaneService.createMemoryLane({
        title: laneTitle,
        description: laneDescription,
        user_id: user.id,
        is_public: isPublic,
      })

      // 2. Upload the cover image if provided
      if (coverImage) {
        setCurrentStep('Uploading cover image...')
        setProgress(20)
        const coverImageUrl = await memoryLaneService.uploadCoverImage(
          coverImage.file,
          newLane.id
        )
        await memoryLaneService.setCoverImage(newLane.id, coverImageUrl)
      }

      // 3. Create each event and its images
      const totalEvents = events.length
      const progressPerEvent = 70 / totalEvents

      for (let i = 0; i < events.length; i++) {
        const event = events[i]
        setCurrentStep(
          `Creating event ${i + 1} of ${totalEvents}: ${event.title}`
        )
        setProgress(20 + Math.floor(progressPerEvent * i))

        const newEvent = await eventService.createEvent({
          title: event.title,
          description: event.description,
          event_date: event.date,
          location: event.location || null,
          memory_lane_id: newLane.id,
          order_position: i + 1,
        })

        // 4. Upload images for each event
        const totalImages = event.images.length
        const progressPerImage = progressPerEvent / (totalImages || 1)

        for (let j = 0; j < event.images.length; j++) {
          const imageFile = event.images[j]
          setCurrentStep(
            `Uploading image ${j + 1} of ${totalImages} for ${event.title}`
          )
          setProgress(
            20 +
              Math.floor(progressPerEvent * i) +
              Math.floor(progressPerImage * j)
          )

          const imageUrl = await eventService.uploadEventImage(
            imageFile.file,
            newEvent.id
          )

          // 5. Add image to database
          await eventService.addEventImage(
            newEvent.id,
            imageUrl,
            imageFile.file.name, // Using filename as alt text
            j === 0 // First image is primary
          )
        }
      }

      // Finishing up
      setCurrentStep('Finishing up...')
      setProgress(95)

      // Slight delay to show completion
      setTimeout(() => {
        setCurrentStep('Done! Redirecting to memory lane...')
        setProgress(100)
        // Navigate to the memory lane page
        navigate('/memories')
      }, 1000)
    } catch (err) {
      console.error('Error creating memory lane:', err)
      setError('Failed to create memory lane. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Clean up object URLs when component unmounts
  const cleanup = () => {
    events.forEach((event) => {
      event.images.forEach((image) => {
        URL.revokeObjectURL(image.preview)
      })
    })

    if (coverImage) {
      URL.revokeObjectURL(coverImage.preview)
    }
  }

  // Add useEffect to call cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Loading Overlay */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
        >
          <motion.div
            className='bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-xl text-center'
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <motion.div
              className='mx-auto mb-4 h-16 w-16 text-primary'
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <ArrowPathIcon className='h-full w-full' />
            </motion.div>
            <h3 className='text-xl font-semibold mb-2'>
              {currentStep || 'Creating your Memory Lane'}
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-4'>
              Please wait while we save your memories. This might take a moment
              if you've added multiple images.
            </p>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2'>
              <motion.div
                className='bg-primary h-2.5 rounded-full'
                initial={{ width: '10%' }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              ></motion.div>
            </div>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {progress}% complete
            </p>
          </motion.div>
        </motion.div>
      )}

      <Button variant='ghost' size='default' asChild className='mb-4'>
        <Link to='/memories'>
          <ChevronLeftIcon className='mr-2 h-4 w-4' />
          Back to Memory Lanes
        </Link>
      </Button>

      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6 text-gray-900 dark:text-white'>
          Create a New Memory Lane
        </h1>

        {error && (
          <div className='bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 mb-6 rounded-md'>
            <p className='font-medium'>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Memory Lane Details</CardTitle>
              <CardDescription>
                Start by giving your memory lane a title and description
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>
                  Title <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='title'
                  placeholder='e.g., Our Summer Vacation 2023'
                  value={laneTitle}
                  onChange={(e) => setLaneTitle(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  placeholder='Describe what this memory lane is about...'
                  value={laneDescription}
                  onChange={(e) => setLaneDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='is-public'
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Label htmlFor='is-public'>Make this memory lane public</Label>
              </div>
              <div className='space-y-2'>
                <Label>Cover Image (Optional)</Label>
                {coverImage ? (
                  <div className='relative w-52 h-52'>
                    <img
                      src={coverImage.preview}
                      alt='Cover preview'
                      className='w-full h-full object-cover rounded-md'
                    />
                    <button
                      type='button'
                      className='absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white'
                      onClick={removeCoverImage}
                    >
                      <XMarkIcon className='h-5 w-5' />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`border-2 ${
                      dragActive === 'cover'
                        ? 'border-primary'
                        : 'border-dashed'
                    } rounded-lg p-6 text-center`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter('cover', e)}
                    onDragLeave={handleDragLeave}
                    onDrop={handleCoverImageDrop}
                  >
                    <PhotoIcon className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                      Drag and drop your cover image here, or click to browse
                    </p>
                    <input
                      type='file'
                      id='cover-image'
                      className='hidden'
                      accept='image/*'
                      onChange={handleCoverImageUpload}
                    />
                    <label htmlFor='cover-image'>
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        className='cursor-pointer'
                        onClick={() =>
                          document.getElementById('cover-image')?.click()
                        }
                      >
                        Upload Cover
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <h2 className='text-xl font-semibold mb-4 text-gray-900 dark:text-white'>
            Memory Events
          </h2>
          <p className='text-gray-500 dark:text-gray-400 mb-6'>
            Add events to your memory lane in chronological order
          </p>

          {events.map((event, index) => (
            <Card key={event.id} className='mb-6'>
              <CardHeader className='flex flex-row items-start justify-between'>
                <div>
                  <CardTitle>Event {index + 1}</CardTitle>
                  <CardDescription>
                    Add details about this memory
                  </CardDescription>
                </div>
                {events.length > 1 && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => removeEvent(event.id)}
                  >
                    <XMarkIcon className='h-4 w-4' />
                  </Button>
                )}
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor={`event-title-${event.id}`}>
                    Title <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id={`event-title-${event.id}`}
                    placeholder='e.g., Beach Day'
                    value={event.title}
                    onChange={(e) =>
                      updateEvent(event.id, 'title', e.target.value)
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`event-date-${event.id}`}>
                    Date <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id={`event-date-${event.id}`}
                    type='date'
                    value={event.date}
                    onChange={(e) =>
                      updateEvent(event.id, 'date', e.target.value)
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`event-location-${event.id}`}>
                    Location (Optional)
                  </Label>
                  <Input
                    id={`event-location-${event.id}`}
                    placeholder='e.g., Malibu Beach'
                    value={event.location}
                    onChange={(e) =>
                      updateEvent(event.id, 'location', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`event-description-${event.id}`}>
                    Description <span className='text-red-500'>*</span>
                  </Label>
                  <Textarea
                    id={`event-description-${event.id}`}
                    placeholder='Describe what happened...'
                    value={event.description}
                    onChange={(e) =>
                      updateEvent(event.id, 'description', e.target.value)
                    }
                    rows={3}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label>
                    Photos <span className='text-red-500'>*</span>
                  </Label>
                  <p className='text-xs text-muted-foreground mb-2'>
                    At least one photo is required for each event. The first
                    photo will be marked as primary.
                  </p>
                  {event.images.length > 0 ? (
                    <div className='grid grid-cols-3 gap-2 mb-4'>
                      {event.images.map((image, imageIndex) => (
                        <div key={imageIndex} className='relative'>
                          <img
                            src={image.preview}
                            alt={`Preview ${imageIndex + 1}`}
                            className='w-full h-full object-cover rounded-md'
                          />
                          <button
                            type='button'
                            className='absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white'
                            onClick={() => removeImage(event.id, imageIndex)}
                          >
                            <XMarkIcon className='h-4 w-4' />
                          </button>
                          {imageIndex === 0 && (
                            <div className='absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full'>
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-red-500 dark:text-red-400 mb-2'>
                      At least one photo is required for each event.
                    </p>
                  )}
                  <div
                    className={`border-2 ${
                      dragActive === event.id
                        ? 'border-primary'
                        : 'border-dashed'
                    } rounded-lg p-6 text-center`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(event.id, e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleImageDrop(event.id, e)}
                  >
                    <PhotoIcon className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                      Drag and drop your photos here, or click to browse
                    </p>
                    <input
                      type='file'
                      id={`event-photos-${event.id}`}
                      className='hidden'
                      accept='image/*'
                      multiple
                      onChange={(e) => handleImageUpload(event.id, e)}
                    />
                    <label htmlFor={`event-photos-${event.id}`}>
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        className='cursor-pointer'
                        onClick={() =>
                          document
                            .getElementById(`event-photos-${event.id}`)
                            ?.click()
                        }
                      >
                        Upload Photos
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type='button'
            variant='outline'
            onClick={addEvent}
            className='mb-8 w-full'
            disabled={isSubmitting}
          >
            <PlusIcon className='mr-2 h-4 w-4' />
            Add Another Event
          </Button>

          <div className='flex justify-between mt-8'>
            <Button variant='outline' type='button' asChild>
              <Link to='/memories'>Cancel</Link>
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !laneTitle || events.length === 0}
              className={isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
            >
              {isSubmitting ? 'Creating...' : 'Create Memory Lane'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
