import { useRef } from 'react'
import { PlusCircle, Camera, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import UserList, {
  UserListRefHandle,
} from '@/components/features/user/UserList'
import { CreateUserDialog } from '@/components/features/user/CreateUserDialog'

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  return (
    <motion.div
      className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <div className='flex flex-col items-center text-center'>
        {icon}
        <h3 className='text-xl font-bold mb-2 text-gray-900 dark:text-white'>
          {title}
        </h3>
        <p className='text-gray-600 dark:text-gray-300'>{description}</p>
      </div>
    </motion.div>
  )
}

export function HomePage() {
  const userListRef = useRef<UserListRefHandle>(null)

  const handleUserCreated = () => {
    // Refresh the user list when a new user is created
    userListRef.current?.fetchUsers()
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='container mx-auto px-4 py-8'>
        <motion.header
          className='mb-16 text-center'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className='text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text'>
            Memory Lane
          </h1>
          <p className='text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300'>
            Capture, cherish, and share your most precious moments with loved
            ones
          </p>
        </motion.header>

        <motion.section
          className='mb-16'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className='text-3xl font-bold mb-12 text-center bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text'>
            How It Works
          </h2>
          <div className='grid gap-8 md:grid-cols-3'>
            <FeatureCard
              icon={<PlusCircle className='h-8 w-8 mb-4 text-primary' />}
              title='Create a Memory Lane'
              description='Start by creating a new memory lane for a specific journey, event, or time period in your life.'
              delay={0}
            />
            <FeatureCard
              icon={<Camera className='h-8 w-8 mb-4 text-primary' />}
              title='Add Your Memories'
              description="Upload photos and add details about each memory including when it happened and why it's special."
              delay={0.2}
            />
            <FeatureCard
              icon={<Share2 className='h-8 w-8 mb-4 text-primary' />}
              title='Share With Loved Ones'
              description='Invite friends and family to view your memory lane or collaborate by adding their own memories.'
              delay={0.4}
            />
          </div>
        </motion.section>

        {/* Demo Section */}
        <motion.section
          className='mb-16'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className='text-3xl font-bold mb-12 text-center bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text'>
            Demo
          </h2>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
            <UserList
              ref={userListRef}
              createUserDialog={
                <CreateUserDialog onUserCreated={handleUserCreated} />
              }
            />
          </div>
        </motion.section>
      </div>
    </div>
  )
}
