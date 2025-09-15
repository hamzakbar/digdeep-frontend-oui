import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

export function NotFound({ resource = 'page' }: { resource?: string }) {
  return (
    <div className='flex h-screen flex-col items-center justify-center gap-4 text-center'>
      <div className='space-y-2'>
        <h1 className='text-4xl font-bold'>404 - Not Found</h1>
        <p className='text-muted-foreground'>
          The {resource} you are looking for does not exist or you do not have
          permission to view it.
        </p>
      </div>
      <Button asChild>
        <Link to='/dashboard'>Go to Dashboard</Link>
      </Button>
    </div>
  )
}