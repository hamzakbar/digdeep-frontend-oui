import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { apiFetch } from '@/lib/api'

interface FileShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  fileName: string
}

const shareFile = (data: {
  sessionId: string
  fileName: string
  description: string
  expiresInDays: number
  strategy: string
}) => {
  return apiFetch(
    `/files/session/${data.sessionId}/outputs/${encodeURIComponent(
      data.fileName
    )}/share`,
    {
      method: 'POST',
      body: JSON.stringify({
        description: data.description,
        expires_in_days: data.expiresInDays,
        strategy: data.strategy,
      }),
    }
  )
}

interface ShareFileResponse {
  share_token: string
}

export function FileShareDialog({
  open,
  onOpenChange,
  sessionId,
  fileName,
}: FileShareDialogProps) {
  const [description, setDescription] = useState('')
  const [expiresIn, setExpiresIn] = useState('10')
  const [strategy, setStrategy] = useState('reuse')

  const mutation = useMutation<ShareFileResponse, Error, Parameters<typeof shareFile>[0]>({  
    mutationFn: shareFile,
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}/downloads/${data.share_token}`
      navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleShare = () => {
    mutation.mutate({
      sessionId,
      fileName,
      description,
      expiresInDays: parseInt(expiresIn) || 10,
      strategy,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share File: {fileName}</DialogTitle>
          <DialogDescription>
            Generate a public link to share this file. Anyone with the link can
            download it.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='description'>Description (Optional)</Label>
            <Textarea
              id='description'
              placeholder='Enter a description for this file'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='expiresIn'>Expires in (days)</Label>
            <Input
              id='expiresIn'
              type='number'
              min='1'
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          <div className='space-y-2'>
            <Label>Sharing Policy</Label>
            <RadioGroup
              value={strategy}
              onValueChange={setStrategy}
              className='mt-2'
              disabled={mutation.isPending}
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='reuse' id='reuse' />
                <Label htmlFor='reuse' className='font-normal'>
                  Reuse existing link if available
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='rotate' id='rotate' />
                <Label htmlFor='rotate' className='font-normal'>
                  Deactivate existing link and create new
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='new' id='new' />
                <Label htmlFor='new' className='font-normal'>
                  Always create new link
                </Label>
              </div>
            </RadioGroup>
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
          <Button onClick={handleShare} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}