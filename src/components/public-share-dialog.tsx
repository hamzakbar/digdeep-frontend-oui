import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createPublicShareLink } from '@/lib/api'
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

interface PublicShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function PublicShareDialog({
  open,
  onOpenChange,
  sessionId,
}: PublicShareDialogProps) {
  const [ttlDays, setTtlDays] = useState(7)
  const [shareLabel, setShareLabel] = useState('')

  const mutation = useMutation({
    mutationFn: (data: { ttlDays: number; label?: string }) =>
      createPublicShareLink(sessionId, data.ttlDays, data.label),
    onSuccess: (data) => {
      const shareToken = data.share_token
      const url = `${window.location.origin}/share/${shareToken}`
      navigator.clipboard.writeText(url)
      toast.success('Public share link copied to clipboard!')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to create public link: ${error.message}`)
    },
  })

  const handleCreateAndCopyLink = () => {
    mutation.mutate({ ttlDays, label: shareLabel.trim() || undefined })
  }

  useEffect(() => {
    if (open) {
      setShareLabel('')
      setTtlDays(7)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Public Share Link</DialogTitle>
          <DialogDescription>
            Anyone with this link can view the session. The link will
            automatically expire.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='share-label'>Optional Label</Label>
            <Input
              id='share-label'
              type='text'
              value={shareLabel}
              onChange={(e) => setShareLabel(e.target.value)}
              disabled={mutation.isPending}
              placeholder='e.g., "Consult with Dr. Smith"'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='ttl-days'>Expires in (days)</Label>
            <Input
              id='ttl-days'
              type='number'
              min={1}
              max={365}
              value={ttlDays}
              onChange={(e) => setTtlDays(Number(e.target.value))}
              disabled={mutation.isPending}
              className='w-32'
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
          <Button
            onClick={handleCreateAndCopyLink}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating Link...
              </>
            ) : (
              'Create & Copy Link'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
