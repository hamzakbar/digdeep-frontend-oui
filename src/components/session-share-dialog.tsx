import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { findUserByEmail, shareSessionWithUser } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface SessionShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function SessionShareDialog({
  open,
  onOpenChange,
  sessionId,
}: SessionShareDialogProps) {
  const [email, setEmail] = useState('')

  const mutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const userResponse = await findUserByEmail(userEmail)
      if (!userResponse || !userResponse.id) {
        throw new Error('User with that email address not found.')
      }
      const userId = userResponse.id

      return shareSessionWithUser(sessionId, userId)
    },
    onSuccess: () => {
      toast.success(`Session shared successfully with ${email}`)
      setEmail('')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to share session')
    },
  })

  const handleShare = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    mutation.mutate(email)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Session</DialogTitle>
          <DialogDescription>
            Share this session with another user. They will have read-only
            access.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>User's Email Address</Label>
            <Input
              id='email'
              type='email'
              placeholder='name@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={mutation.isPending || !email}>
            {mutation.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sharing...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
