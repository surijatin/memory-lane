import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MemoryLane, Event, Image, User } from '@/types'
import { memoryLaneService } from '@/services/memoryLaneService'
import { eventService } from '@/services/eventService'
import { userService } from '@/services/userService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ImageGallery } from '@/components/features/image/ImageGallery'
import {
  ChevronLeftIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { CubeIcon } from '@heroicons/react/20/solid'

export function SharedMemoryLaneView() {
  const { shareId } = useParams<{ shareId: string }>()
  const [memoryLane, setMemoryLane] = useState<MemoryLane | null>(null)
  const [creator, setCreator] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [eventImages, setEventImages] = useState<Record<string, Image[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const eventRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    async function fetchMemoryLane() {
      if (!shareId) return

      try {
        setLoading(true)
        setError(null)

        // Fetch memory lane details
        const laneData = await memoryLaneService.getMemoryLaneById(shareId)
        if (!laneData) {
          setError('Memory lane not found')
          return
        }

        // Only allow access to public memory lanes via shareable link
        if (!laneData.is_public) {
          setError('This memory lane is not available for public viewing')
          return
        }

        setMemoryLane(laneData)

        // Fetch the creator's information
        try {
          const creatorData = await userService.getUserById(laneData.user_id)
          if (creatorData) {
            setCreator(creatorData)
          }
        } catch (userErr) {
          console.error('Error fetching creator information:', userErr)
          // Don't set an error - the memory lane can still be displayed without creator info
        }

        // Fetch events for this lane
        const eventsData = await memoryLaneService.getMemoryLaneEvents(shareId)
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
  }, [shareId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleEventClick = (eventId: string) => {
    setActiveEvent(eventId)
    // Scroll to the event
    if (eventRefs.current[eventId]) {
      eventRefs.current[eventId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const handleViewImages = (eventId: string, startIndex: number = 0) => {
    setCurrentEventId(eventId)
    setCurrentImageIndex(startIndex)
    setGalleryOpen(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Helper function to get user initials
  const getInitials = (user: User) => {
    if (!user) return '?'
    const firstInitial = user.first_name ? user.first_name[0] : ''
    const lastInitial = user.last_name ? user.last_name[0] : ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (error || !memoryLane) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full'>
          <div className='flex items-center mb-4'>
            <div className='bg-blue-600 rounded-md p-2 mr-3'>
              <CubeIcon className='h-6 w-6 text-white' />
            </div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Memory Lane
            </h1>
          </div>
          <div className='text-red-500 text-center mb-4'>
            {error || 'Memory lane not found'}
          </div>
          <Link
            to='/'
            className='block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md'
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='bg-blue-600 rounded-md p-2 mr-3'>
              <CubeIcon className='h-6 w-6 text-white' />
            </div>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
              Memory Lane - Shared View
            </h1>
          </div>
          <Link
            to='/'
            className='flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
          >
            <ChevronLeftIcon className='h-4 w-4 mr-1' />
            Home
          </Link>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Memory Lane Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center'>
            {memoryLane.cover_image_url && (
              <div className='w-full md:w-1/3 mb-4 md:mb-0 md:mr-6'>
                <div className='rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-gray-700'>
                  <img
                    src={memoryLane.cover_image_url}
                    alt={memoryLane.title}
                    className='w-full h-full object-cover'
                  />
                </div>
              </div>
            )}
            <div className='flex-1'>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                {memoryLane.title}
              </h1>
              {memoryLane.description && (
                <p className='text-gray-600 dark:text-gray-300 mb-4'>
                  {memoryLane.description}
                </p>
              )}

              {/* Date Range */}
              {(memoryLane.date_range_start || memoryLane.date_range_end) && (
                <div className='flex items-center mb-4'>
                  <CalendarIcon className='h-4 w-4 mr-2 text-gray-500 dark:text-gray-400' />
                  <span className='text-sm text-gray-500 dark:text-gray-400'>
                    {memoryLaneService.formatDateRange(
                      memoryLane.date_range_start,
                      memoryLane.date_range_end
                    )}
                  </span>
                </div>
              )}

              <div className='flex flex-col space-y-2 text-sm text-gray-500 dark:text-gray-400'>
                <div className='flex items-center'>
                  {creator ? (
                    <>
                      <Avatar className='h-6 w-6 mr-2'>
                        {creator.avatar_path ? (
                          <AvatarImage
                            src={creator.avatar_path}
                            alt={`${creator.first_name} ${creator.last_name}`}
                          />
                        ) : (
                          <AvatarFallback className='text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                            {getInitials(creator)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>
                        Created by {creator.first_name} {creator.last_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserIcon className='h-4 w-4 mr-2' />
                      <span>Shared memory lane</span>
                    </>
                  )}
                </div>
                <div>Shared {formatDate(memoryLane.created_at || '')}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline and Events */}
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Timeline */}
          <div className='w-full lg:w-1/4'>
            <div className='sticky top-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Timeline
              </h2>
              <div className='space-y-1'>
                {events.map((event) => (
                  <motion.button
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEventClick(event.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      activeEvent === event.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className='font-medium truncate'>{event.title}</div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {formatDate(event.event_date)}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Events */}
          <motion.div
            className='flex-1'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {events.map((event) => (
              <motion.div
                key={event.id}
                ref={(el) => (eventRefs.current[event.id] = el)}
                variants={itemVariants}
                className='mb-8'
              >
                <Card
                  className={`overflow-hidden transition-shadow ${
                    activeEvent === event.id
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : 'shadow-md hover:shadow-lg'
                  }`}
                >
                  <CardContent className='p-0'>
                    <div className='p-6'>
                      <h3 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
                        {event.title}
                      </h3>
                      <div className='flex flex-wrap gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400'>
                        <div className='flex items-center'>
                          <CalendarIcon className='h-4 w-4 mr-1' />
                          {formatDate(event.event_date)}
                        </div>
                        {event.location && (
                          <div className='flex items-center'>
                            <MapPinIcon className='h-4 w-4 mr-1' />
                            {event.location}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className='mb-4 text-gray-700 dark:text-gray-300'>
                          {event.description}
                        </p>
                      )}

                      {/* Images Section */}
                      {eventImages[event.id] &&
                        eventImages[event.id].length > 0 && (
                          <div>
                            <div className='flex items-center mb-2'>
                              <PhotoIcon className='h-4 w-4 mr-1 text-gray-500 dark:text-gray-400' />
                              <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
                                Photos
                              </h4>
                            </div>
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
                              {eventImages[event.id].map((image, index) => (
                                <motion.div
                                  key={image.id}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className='relative aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer'
                                  onClick={() =>
                                    handleViewImages(event.id, index)
                                  }
                                >
                                  <img
                                    src={image.url}
                                    alt={image.alt_text || `Photo ${index + 1}`}
                                    className='w-full h-full object-cover'
                                  />
                                </motion.div>
                              ))}
                            </div>
                            <div className='mt-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleViewImages(event.id)}
                                className='text-blue-600 dark:text-blue-400'
                              >
                                View All Photos
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Image Gallery */}
      {currentEventId && (
        <ImageGallery
          images={eventImages[currentEventId] || []}
          initialImageIndex={currentImageIndex}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}
