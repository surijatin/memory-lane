import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { User, MemoryLane, Event, Image } from '@/types'
import { memoryLaneService } from '@/services/memoryLaneService'
import { eventService } from '@/services/eventService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageGallery } from '@/components/features/image/ImageGallery'
import {
  ChevronLeftIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MemoryLaneDetailProps {
  user: User
}

export function MemoryLaneDetail({ user }: MemoryLaneDetailProps) {
  const { laneId } = useParams<{ laneId: string }>()
  const [memoryLane, setMemoryLane] = useState<MemoryLane | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [eventImages, setEventImages] = useState<Record<string, Image[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Visibility toggle state
  const [isChangingVisibility, setIsChangingVisibility] = useState(false)
  const [showShareConfirmDialog, setShowShareConfirmDialog] = useState(false)

  useEffect(() => {
    async function fetchMemoryLane() {
      if (!laneId) return

      try {
        setLoading(true)
        setError(null)

        // Fetch memory lane details
        const laneData = await memoryLaneService.getMemoryLaneById(laneId)
        if (!laneData) {
          setError('Memory lane not found')
          return
        }

        // Check if this user is allowed to view this lane
        if (laneData.user_id !== user.id && !laneData.is_public) {
          setError('You do not have permission to view this memory lane')
          return
        }

        setMemoryLane(laneData)

        // Fetch events for this lane
        const eventsData = await memoryLaneService.getMemoryLaneEvents(laneId)
        // Sort events by order_position
        eventsData.sort((a, b) => a.order_position - b.order_position)
        setEvents(eventsData)

        // Set the first event as active
        if (eventsData.length > 0) {
          setActiveEvent(eventsData[0].id)
        }

        // Fetch images for each event
        const imagesMap: Record<string, Image[]> = {}

        for (const event of eventsData) {
          const eventImagesData = await eventService.getEventImages(event.id)
          imagesMap[event.id] = eventImagesData
        }

        setEventImages(imagesMap)
      } catch (err) {
        console.error('Error fetching memory lane details:', err)
        setError('Failed to load memory lane details')
      } finally {
        setLoading(false)
      }
    }

    fetchMemoryLane()
  }, [laneId])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  // Handle toggling the memory lane visibility
  const handleToggleVisibility = useCallback(async () => {
    if (!memoryLane || !laneId) return

    setIsChangingVisibility(true)

    try {
      const newVisibility = !memoryLane.is_public

      await memoryLaneService.updateMemoryLane(laneId, {
        is_public: newVisibility,
      })

      // Update local state
      setMemoryLane({
        ...memoryLane,
        is_public: newVisibility,
      })

      toast.success(
        newVisibility
          ? 'Memory Lane is now public'
          : 'Memory Lane is now private',
        {
          description: newVisibility
            ? 'Anyone with the link can now view this Memory Lane'
            : 'Only you can view this Memory Lane now',
        }
      )
    } catch (err) {
      console.error('Error updating memory lane visibility:', err)
      toast.error('Error updating visibility', {
        description:
          'Could not update the Memory Lane visibility. Please try again.',
      })
    } finally {
      setIsChangingVisibility(false)
    }
  }, [laneId, memoryLane])

  // Generate a shareable link
  const getShareableLink = useCallback(() => {
    if (!laneId) return ''

    // Create a shareable link using the /share/:shareId route
    const baseUrl = window.location.origin
    return `${baseUrl}/share/${laneId}`
  }, [laneId])

  // Handle copying the link to clipboard
  const handleCopyShareableLink = useCallback(async () => {
    if (!memoryLane) return

    // Check if the memory lane is public
    if (!memoryLane.is_public) {
      // Show confirmation dialog instead of automatically making it public
      setShowShareConfirmDialog(true)
      return
    }

    // Copy the link to clipboard if already public
    const shareableLink = getShareableLink()
    try {
      await navigator.clipboard.writeText(shareableLink)
      toast.success('Link copied!', {
        description: 'Shareable link has been copied to your clipboard.',
      })
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      toast.error('Error copying link', {
        description:
          'Could not copy the link to your clipboard. Please try again.',
      })
    }
  }, [laneId, memoryLane, getShareableLink])

  // Handle confirmation to make public and share
  const handleConfirmMakePublicAndShare = useCallback(async () => {
    if (!memoryLane || !laneId) return

    try {
      // Make the memory lane public
      await memoryLaneService.updateMemoryLane(laneId, {
        is_public: true,
      })

      // Update local state
      setMemoryLane({
        ...memoryLane,
        is_public: true,
      })

      // Copy the link to clipboard
      const shareableLink = getShareableLink()
      await navigator.clipboard.writeText(shareableLink)

      toast.success('Memory Lane is now public', {
        description:
          'The Memory Lane has been made public and the link has been copied to your clipboard.',
      })
    } catch (err) {
      console.error('Error making memory lane public:', err)
      toast.error('Error sharing Memory Lane', {
        description: 'Could not make the Memory Lane public. Please try again.',
      })
    } finally {
      setShowShareConfirmDialog(false)
    }
  }, [laneId, memoryLane, getShareableLink])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error || !memoryLane) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='text-center py-8'>
          <CardContent>
            <h2 className='text-xl font-semibold mb-2'>
              {error || 'Memory lane not found'}
            </h2>
            <Button variant='outline' asChild className='mt-4'>
              <Link to='/memories'>Go back to memory lanes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user.id === memoryLane.user_id

  const scrollToEvent = (eventId: string) => {
    if (eventRefs.current[eventId]) {
      eventRefs.current[eventId]?.scrollIntoView({ behavior: 'smooth' })
      setActiveEvent(eventId)
    }
  }

  // Helper function to open the gallery
  const openGallery = (eventId: string, imageIndex: number) => {
    setCurrentEventId(eventId)
    setCurrentImageIndex(imageIndex)
    setGalleryOpen(true)
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Back Button */}
      <Button variant='ghost' size='default' asChild className='mb-6'>
        <Link to='/memories'>
          <ChevronLeftIcon className='mr-2 h-4 w-4' />
          Back to Memory Lanes
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mb-12'
      >
        {/* Main header section with left-right layout */}
        <div className='grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8'>
          {/* Left column: Title and description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className='text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text dark:from-blue-400 dark:to-blue-300'>
              {memoryLane.title}
            </h1>
            <p className='text-muted-foreground mb-3'>
              Created by {user.username} on{' '}
              {formatDate(memoryLane.created_at || '')}
            </p>

            {/* Date Range */}
            {(memoryLane.date_range_start || memoryLane.date_range_end) && (
              <div className='flex items-center mt-1 mb-3'>
                <CalendarIcon className='h-4 w-4 mr-2 text-muted-foreground' />
                <span className='text-sm font-medium text-muted-foreground'>
                  {memoryLaneService.formatDateRange(
                    memoryLane.date_range_start,
                    memoryLane.date_range_end
                  )}
                </span>
              </div>
            )}

            {/* Description */}
            {memoryLane.description && (
              <motion.p
                className='mt-4 text-lg text-foreground/90'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {memoryLane.description}
              </motion.p>
            )}

            <motion.div
              className='mt-4 text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  memoryLane.is_public
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {memoryLane.is_public
                  ? 'Public memory lane'
                  : 'Private memory lane'}
              </span>
            </motion.div>
          </motion.div>

          {/* Right column: Cover image and action buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='flex flex-col'
          >
            {/* Cover image */}
            <motion.div
              className='w-full rounded-lg overflow-hidden shadow-soft mb-4 border-border'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className='aspect-[4/3] w-full bg-muted flex items-center justify-center'>
                {memoryLane.cover_image_url ? (
                  <img
                    src={memoryLane.cover_image_url}
                    alt={memoryLane.title}
                    className='w-full h-full object-contain transition-transform duration-700'
                  />
                ) : (
                  <div className='w-full h-full flex flex-col items-center justify-center p-4'>
                    <CalendarIcon className='h-12 w-12 text-muted-foreground mb-2' />
                    <p className='text-sm text-muted-foreground text-center'>
                      No cover image available
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className='flex gap-3 justify-center mt-2'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-full transition-transform border-border hover:bg-accent hover:text-accent-foreground dark:border-blue-700 dark:hover:bg-blue-900/40 dark:text-blue-300'
                  disabled={true}
                >
                  <HeartIcon className='mr-2 h-4 w-4' />
                  Like
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-full transition-transform border-border hover:bg-accent hover:text-accent-foreground dark:border-blue-700 dark:hover:bg-blue-900/40 dark:text-blue-300'
                  disabled={true}
                >
                  <ChatBubbleLeftIcon className='mr-2 h-4 w-4' />
                  Comment
                </Button>
              </motion.div>

              <motion.div
                className='flex justify-end space-x-2'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Visibility Toggle Button */}
                <motion.div
                  className='inline-block'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant='outline'
                    size='sm'
                    className={`rounded-full transition-transform border-border hover:bg-accent hover:text-accent-foreground dark:border-blue-700 dark:hover:bg-blue-900/40 ${
                      memoryLane?.is_public
                        ? 'dark:text-green-300'
                        : 'dark:text-yellow-300'
                    }`}
                    onClick={handleToggleVisibility}
                    disabled={isChangingVisibility}
                  >
                    {memoryLane?.is_public ? (
                      <>
                        <GlobeAltIcon className='mr-2 h-4 w-4' />
                        Public
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className='mr-2 h-4 w-4' />
                        Private
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Share Button */}
                <motion.div
                  className='inline-block'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-full transition-transform border-border hover:bg-accent hover:text-accent-foreground dark:border-blue-700 dark:hover:bg-blue-900/40 dark:text-blue-300'
                      >
                        <ShareIcon className='mr-2 h-4 w-4' />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={handleCopyShareableLink}>
                        Copy Shareable Link
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={true}>
                        Share to Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={true}>
                        Share to Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={true}>Email</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {/* Confirmation Dialog for making private memory lane public */}
                <AlertDialog
                  open={showShareConfirmDialog}
                  onOpenChange={setShowShareConfirmDialog}
                >
                  <AlertDialogContent className='dark:bg-gray-800 dark:text-white'>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Make Memory Lane Public?
                      </AlertDialogTitle>
                      <AlertDialogDescription className='dark:text-gray-300'>
                        This Memory Lane is currently private. To share it, the
                        visibility needs to be changed to public. Anyone with
                        the link will be able to view this Memory Lane.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className='dark:text-gray-300 dark:hover:bg-gray-700'>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmMakePublicAndShare}
                        className='bg-primary hover:bg-primary/90 dark:bg-blue-600 dark:hover:bg-blue-700'
                      >
                        Make Public & Copy Link
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className='text-center py-8'>
            <CardContent>
              <h2 className='text-xl font-semibold mb-2'>No events yet</h2>
              <p className='text-gray-500 dark:text-gray-400 mb-4'>
                This memory lane doesn't have any events yet.
              </p>
              {isOwner && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button>Add First Event</Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className='grid md:grid-cols-[280px_1fr] gap-8'>
          {/* Timeline navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className='border-border border rounded-xl p-6 bg-card h-fit sticky top-6'
          >
            <h2 className='text-lg font-semibold mb-4 text-card-foreground'>
              Timeline
            </h2>
            <div className='space-y-3'>
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <Button
                    variant={activeEvent === event.id ? 'secondary' : 'ghost'}
                    className={`w-full justify-start text-left h-auto py-3 px-4 ${
                      activeEvent === event.id
                        ? 'bg-secondary text-secondary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => scrollToEvent(event.id)}
                  >
                    <div className='flex flex-col items-start w-full overflow-hidden'>
                      <span className='font-medium truncate w-full'>
                        {event.title}
                      </span>
                      <span className='text-xs text-muted-foreground mt-1'>
                        {formatDate(event.event_date)}
                      </span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Event content area */}
          <div>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                id={`event-${event.id}`}
                ref={(el) => (eventRefs.current[event.id] = el)}
                className='mb-10 rounded-xl p-6 bg-card shadow-soft border-border border'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <motion.h2
                  className='text-2xl font-bold mb-2 text-card-foreground'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {event.title}
                </motion.h2>

                <motion.div
                  className='text-sm text-muted-foreground mb-4 flex items-center'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {formatDate(event.event_date)}
                  {event.location && (
                    <>
                      <span className='mx-2'>•</span>
                      <MapPinIcon className='mr-2 h-4 w-4' />
                      {event.location}
                    </>
                  )}
                </motion.div>

                <motion.p
                  className='mb-6 text-card-foreground/90'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {event.description || 'No description provided.'}
                </motion.p>

                {/* Images for this event */}
                {eventImages[event.id] && eventImages[event.id].length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <h3 className='text-lg font-medium mb-4 flex items-center text-card-foreground'>
                      <PhotoIcon className='h-5 w-5 mr-2' />
                      Photos ({eventImages[event.id].length})
                    </h3>
                    <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-3'>
                      {eventImages[event.id].map((image, imageIndex) => (
                        <motion.div
                          key={image.id}
                          className='relative group rounded-xl overflow-hidden shadow-soft cursor-pointer'
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.3 + imageIndex * 0.1,
                          }}
                          whileHover={{
                            scale: 1.03,
                            transition: { duration: 0.2 },
                          }}
                          onClick={() => openGallery(event.id, imageIndex)}
                        >
                          <div className='w-full aspect-[4/3] bg-muted flex items-center justify-center'>
                            <img
                              src={image.url}
                              alt={image.alt_text || event.title}
                              className='w-full h-full object-contain transition-transform duration-300 group-hover:scale-105'
                            />
                          </div>

                          {image.is_primary && (
                            <div className='absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full'>
                              Primary
                            </div>
                          )}

                          <motion.div
                            className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100'
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant='secondary'
                                size='icon'
                                className='rounded-full transition-transform'
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent gallery from opening
                                  openGallery(event.id, imageIndex)
                                }}
                              >
                                <EyeIcon className='h-4 w-4' />
                              </Button>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {currentEventId && eventImages[currentEventId] && (
        <ImageGallery
          images={eventImages[currentEventId]}
          initialImageIndex={currentImageIndex}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className='container mx-auto px-4 py-8 animate-pulse'>
      {/* Back button */}
      <div className='h-10 w-32 bg-muted rounded mb-6'></div>

      {/* Main header section */}
      <div className='mb-12'>
        {/* Two column layout */}
        <div className='grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8'>
          {/* Left column: Title and description */}
          <div className='space-y-4'>
            <div className='h-10 w-3/4 bg-muted-foreground/20 rounded'></div>
            <div className='h-5 w-1/2 bg-muted-foreground/20 rounded'></div>
            <div className='h-24 w-full bg-muted-foreground/20 rounded mt-4'></div>
            <div className='h-5 w-1/3 bg-muted-foreground/20 rounded'></div>
          </div>

          {/* Right column: Cover image and action buttons */}
          <div className='space-y-4'>
            {/* Cover image */}
            <div className='aspect-[4/3] w-full bg-muted rounded-lg shadow-soft'></div>

            {/* Action buttons */}
            <div className='flex justify-center gap-3'>
              <div className='h-9 w-20 bg-muted-foreground/20 rounded-full'></div>
              <div className='h-9 w-24 bg-muted-foreground/20 rounded-full'></div>
              <div className='h-9 w-20 bg-muted-foreground/20 rounded-full'></div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Timeline section */}
      <div className='grid md:grid-cols-[280px_1fr] gap-8'>
        {/* Timeline navigation */}
        <div className='border border-border rounded-xl p-6 bg-card h-80'>
          <div className='h-6 w-24 bg-muted-foreground/20 rounded mb-4'></div>
          <div className='space-y-3'>
            <div className='h-14 w-full bg-muted-foreground/20 rounded'></div>
            <div className='h-14 w-full bg-muted-foreground/20 rounded'></div>
            <div className='h-14 w-full bg-muted-foreground/20 rounded'></div>
          </div>
        </div>

        {/* Event content area */}
        <div className='rounded-xl p-6 bg-card shadow-soft border-border border'>
          <div className='space-y-6'>
            <div>
              <div className='h-8 w-2/3 bg-muted-foreground/20 rounded mb-2'></div>
              <div className='h-4 w-1/3 bg-muted-foreground/20 rounded'></div>
            </div>
            <div className='h-20 w-full bg-muted-foreground/20 rounded'></div>
            <div>
              <div className='h-6 w-32 bg-muted-foreground/20 rounded mb-4'></div>
              <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-3'>
                {/* Event image placeholders with consistent aspect ratio */}
                <div className='aspect-[4/3] bg-muted rounded-xl shadow-soft'></div>
                <div className='aspect-[4/3] bg-muted rounded-xl shadow-soft'></div>
                <div className='aspect-[4/3] bg-muted rounded-xl shadow-soft'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
