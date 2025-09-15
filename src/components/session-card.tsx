import {
  type Session, 
} from '@/lib/api'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Share2, Copy, Trash2, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Defines all the actions a card can trigger in its parent component.
 */
interface SessionCardProps {
  session: Session
  onInitiateDelete: (session: Session) => void
  onInitiateDuplicate: (session: Session) => void
  onInitiateShare: (session: Session) => void
  onInitiatePublicShare: (session: Session) => void
}

export function SessionCard({
  session,
  onInitiateDelete,
  onInitiateDuplicate,
  onInitiateShare,
  onInitiatePublicShare,
}: SessionCardProps) {
  return (
    <Card className='hover:border-primary transition-colors duration-200 h-full relative group'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10'

            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            aria-label='Session options'
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'

          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          <DropdownMenuItem onClick={() => onInitiateShare(session)}>
            <Users className='mr-2 h-4 w-4' />
            <span>Share with User</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onInitiatePublicShare(session)}>
            <Share2 className='mr-2 h-4 w-4' />
            <span>Create Public Link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onInitiateDuplicate(session)}>
            <Copy className='mr-2 h-4 w-4' />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive focus:bg-destructive/10'
            onClick={() => onInitiateDelete(session)}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CardHeader>
        <CardTitle className='truncate'>
          {session.name || 'Untitled Session'}
        </CardTitle>
        <CardDescription className='line-clamp-2 h-[40px]'>
          {session.data_context || 'No description provided.'}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export function SessionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-3/4 mb-2' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-1/2' />
      </CardHeader>
    </Card>
  )
}
