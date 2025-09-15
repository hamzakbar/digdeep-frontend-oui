import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteSession } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionName?: string | null
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  sessionId,
  sessionName,
}: DeleteSessionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteSession(sessionId),
    onSuccess: () => {
      toast.success('Session deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${error.message}`)
    },
  })

  const handleConfirmDelete = () => {
    mutation.mutate()
  }

  const handleDialogClose = (isOpen: boolean) => {
    if (mutation.isPending) return
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            Are you absolutely sure you want to delete this session?
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='flex items-start rounded-md border border-destructive/50 bg-destructive/5 p-4'>
            <AlertTriangle className='h-6 w-6 text-destructive mr-3 flex-shrink-0' />
            <div className='text-sm text-destructive'>
              <p className='font-semibold'>This action cannot be undone.</p>
              <p>
                This will permanently delete the session "
                {sessionName || 'Untitled Session'}".
              </p>
            </div>
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
            variant='destructive'
            onClick={handleConfirmDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Delete Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
