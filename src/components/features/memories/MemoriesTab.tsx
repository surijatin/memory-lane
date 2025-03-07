import { useState, useEffect } from 'react'
import { User, MemoryLane } from '@/types'
import { memoryLaneService } from '@/services/memoryLaneService'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  CalendarIcon,
  HeartIcon,
  LockOpenIcon,
  LockClosedIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline'

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

// Enhanced item variants with more dynamic animation
const itemVariants = {
  hidden: { opacity: 0, y: 50, rotateX: 10 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
}

// Enhanced hover animation for cards with tilt effect
const cardHoverVariants = {
  initial: {
    boxShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    backgroundColor: 'var(--card)',
  },
  hover: {
    scale: 1.03,
    rotateY: 2,
    rotateX: 2,
    backgroundColor: 'var(--card-hovered, var(--card))',
    boxShadow:
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
}

// New variants for text elements
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
}

// New variants for icons
const iconVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      delay: 0.2,
    },
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 5,
    },
  },
}

// New variants for images
const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

interface MemoriesTabProps {
  user: User
}

export function MemoriesTab({ user }: MemoriesTabProps) {
  const [memoryLanes, setMemoryLanes] = useState<MemoryLane[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMemoryLanes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await memoryLaneService.getUserMemoryLanes(user.id)
      setMemoryLanes(data)
    } catch (err) {
      console.error('Error fetching memory lanes:', err)
      setError('Failed to load memory lanes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemoryLanes()
  }, [user.id])

  const getDateRange = (lane: MemoryLane) => {
    // Use the new date range fields if available
    if (lane.date_range_start && lane.date_range_end) {
      const startDate = new Date(lane.date_range_start)
      const endDate = new Date(lane.date_range_end)

      const start = startDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
      const end = endDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      return `${start} - ${end}`
    }

    // Fallback to created_at/updated_at if date range fields are not set
    const startDate = new Date(lane.created_at || '')

    let endDate = new Date(lane.updated_at || '')
    if (lane.updated_at === lane.created_at || !lane.updated_at) {
      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
    }

    const start = startDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    const end = endDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    return `${start} - ${end}`
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='flex justify-between items-center mb-6'
        >
          <h1 className='text-2xl font-bold text-foreground'>Memory Lanes</h1>
          <Button disabled className='bg-primary/70 text-primary-foreground'>
            <PlusIcon className='h-5 w-5 mr-2' />
            Create Memory Lane
          </Button>
        </motion.div>
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          variants={containerVariants}
          initial='hidden'
          animate='show'
        >
          {[...Array(6)].map((_, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className='overflow-hidden shadow-soft animate-pulse border-border rounded-lg flex flex-col h-full bg-card'>
                {/* Skeleton for cover image - consistent aspect ratio */}
                <div className='aspect-[16/9] w-full bg-muted flex justify-center items-center'>
                  <div className='h-10 w-10 bg-muted-foreground/30 rounded-full'></div>
                </div>

                {/* Skeleton for content */}
                <div className='p-4 flex-grow'>
                  {/* Title with lock icon */}
                  <div className='flex justify-between items-center mb-2'>
                    <div className='h-6 w-3/4 bg-muted-foreground/20 rounded'></div>
                    <div className='h-4 w-4 bg-muted-foreground/20 rounded-full'></div>
                  </div>
                  <div className='h-4 w-1/2 bg-muted-foreground/20 rounded mb-3'></div>
                  <div className='h-4 w-full bg-muted-foreground/20 rounded mb-1'></div>
                  <div className='h-4 w-full bg-muted-foreground/20 rounded mb-1'></div>
                  <div className='h-4 w-2/3 bg-muted-foreground/20 rounded'></div>
                </div>

                {/* Skeleton for footer */}
                <div className='p-4 pt-0 flex justify-between'>
                  <div className='h-5 w-1/3 bg-muted-foreground/20 rounded'></div>
                  <div className='h-5 w-5 bg-muted-foreground/20 rounded-full'></div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='bg-destructive/10 text-destructive p-4 rounded-md'
        >
          <p className='font-medium'>{error}</p>
          <Button
            onClick={fetchMemoryLanes}
            variant='outline'
            size='sm'
            className='mt-2 border-destructive/50 hover:bg-destructive/10'
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='flex justify-between items-center mb-6'
      >
        <motion.h1
          className='text-2xl font-bold text-foreground'
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Memory Lanes
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            asChild
            className='bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:shadow-lg dark:shadow-blue-700/20'
          >
            <Link to='/memories/create'>
              <PlusIcon className='h-5 w-5 mr-2' />
              Create Memory Lane
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {memoryLanes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          className='bg-card border-border border rounded-lg shadow-soft p-8 text-center'
        >
          <div className='flex flex-col items-center justify-center py-6'>
            <motion.div
              className='bg-primary/10 p-3 rounded-full mb-4'
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CalendarIcon className='h-8 w-8 text-primary' />
            </motion.div>
            <motion.h3
              className='text-lg font-medium text-foreground mb-2'
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              No memory lanes yet
            </motion.h3>
            <motion.p
              className='text-muted-foreground max-w-md mb-6'
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Start organizing your memories by creating your first memory lane.
            </motion.p>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild>
                <Link to='/memories/create'>
                  <PlusIcon className='h-5 w-5 mr-2' />
                  Create Your First Memory Lane
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          variants={containerVariants}
          initial='hidden'
          animate='show'
        >
          {memoryLanes.map((lane) => (
            <motion.div
              key={lane.id}
              variants={itemVariants}
              whileHover='hover'
              className='perspective-1000'
            >
              <motion.div variants={cardHoverVariants} initial='initial'>
                <Card className='overflow-hidden shadow-soft border-border rounded-lg flex flex-col h-full bg-card'>
                  {/* Cover image or placeholder */}
                  <Link
                    to={`/memories/lane/${lane.id}`}
                    className='aspect-[16/9] w-full bg-muted flex items-center justify-center overflow-hidden'
                  >
                    {lane.cover_image_url ? (
                      <motion.img
                        src={lane.cover_image_url}
                        alt={lane.title}
                        className='w-full h-full object-cover'
                        variants={imageVariants}
                        whileHover='hover'
                        initial='hidden'
                        animate='show'
                      />
                    ) : (
                      <motion.div
                        className='text-muted-foreground flex flex-col items-center justify-center'
                        variants={iconVariants}
                        initial='hidden'
                        animate='show'
                        whileHover='pulse'
                      >
                        <CalendarIcon className='h-10 w-10 mb-2' />
                        <span className='text-xs'>No cover image</span>
                      </motion.div>
                    )}
                  </Link>

                  <div className='flex flex-col flex-grow p-4 bg-card text-card-foreground'>
                    {/* Title with lock icon */}
                    <div className='flex items-center justify-between mb-1'>
                      <motion.h3
                        className='text-xl font-semibold text-foreground'
                        variants={textVariants}
                        initial='hidden'
                        animate='show'
                      >
                        {lane.title}
                      </motion.h3>
                      {lane.is_public ? (
                        <motion.div
                          variants={iconVariants}
                          initial='hidden'
                          animate='show'
                          whileHover={{
                            rotate: [0, -10, 10, -5, 5, 0],
                            transition: { duration: 0.5 },
                          }}
                        >
                          <LockOpenIcon
                            className='h-4 w-4 text-green-500 ml-2'
                            title='Public'
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          variants={iconVariants}
                          initial='hidden'
                          animate='show'
                          whileHover={{ scale: 1.2 }}
                        >
                          <LockClosedIcon
                            className='h-4 w-4 text-muted-foreground ml-2'
                            title='Private'
                          />
                        </motion.div>
                      )}
                    </div>
                    <motion.p
                      className='text-sm text-foreground/80 line-clamp-3 flex-grow'
                      variants={textVariants}
                      initial='hidden'
                      animate='show'
                    >
                      {lane.description || 'No description available'}
                    </motion.p>

                    <motion.div
                      className='mt-2 flex items-center'
                      variants={textVariants}
                      initial='hidden'
                      animate='show'
                    >
                      <CalendarIcon className='h-4 w-4 text-muted-foreground mr-1' />
                      <span className='text-xs text-muted-foreground'>
                        {getDateRange(lane)}
                      </span>
                    </motion.div>
                  </div>

                  {/* Footer */}
                  <div className='p-4 pt-0 flex justify-between items-center'>
                    <motion.div
                      variants={textVariants}
                      initial='hidden'
                      animate='show'
                      whileHover={{ x: 3 }}
                    >
                      <Button
                        variant='link'
                        size='sm'
                        asChild
                        className='text-primary px-0 hover:text-primary/90 dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Link to={`/memories/lane/${lane.id}`}>
                          View Memory Lane
                          <ArrowRightCircleIcon className='h-4 w-4 mr-1' />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.button
                      className='text-muted-foreground hover:text-primary transition-colors'
                      aria-label='Favorite'
                      variants={iconVariants}
                      initial='hidden'
                      animate='show'
                      whileHover={{
                        scale: 1.3,
                        color: '#ec4899',
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 10,
                        },
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <HeartIcon className='h-5 w-5' />
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
