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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { apiFetch } from '@/lib/api'

interface FileEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  fileName: string
}

const initialFormData = {
  recipient_email: '',
  subject: '',
  custom_message: '',
  prefer_link: false,
  link_description: '',
  link_expires_in_days: 10,
  link_strategy: 'reuse' as const,
}

const emailFile = (data: {
  sessionId: string
  fileName: string
  formData: typeof initialFormData
}) => {
  return apiFetch(
    `/files/session/${data.sessionId}/outputs/${encodeURIComponent(
      data.fileName
    )}/share/email`,
    {
      method: 'POST',
      body: JSON.stringify(data.formData),
    }
  )
}

export function FileEmailDialog({
  open,
  onOpenChange,
  sessionId,
  fileName,
}: FileEmailDialogProps) {
  const [formData, setFormData] = useState(initialFormData)

  const mutation = useMutation({
    mutationFn: emailFile,
    onSuccess: () => {
      toast.success('Email sent successfully!')
      onOpenChange(false)
      setFormData(initialFormData)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = () => {
    if (!formData.recipient_email) {
      toast.error('Recipient email is required.')
      return
    }
    mutation.mutate({ sessionId, fileName, formData })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Share via Email</DialogTitle>
          <DialogDescription>
            Send "{fileName}" as an attachment or a download link.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Recipient Email</Label>
            <Input
              id='email'
              type='email'
              value={formData.recipient_email}
              onChange={(e) =>
                setFormData({ ...formData, recipient_email: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='subject'>Subject</Label>
            <Input
              id='subject'
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='message'>Custom Message (Optional)</Label>
            <Textarea
              id='message'
              value={formData.custom_message}
              onChange={(e) =>
                setFormData({ ...formData, custom_message: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Switch
              id='prefer-link'
              checked={formData.prefer_link}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, prefer_link: checked })
              }
              disabled={mutation.isPending}
            />
            <Label htmlFor='prefer-link'>
              Send as a download link instead of attachment
            </Label>
          </div>
          {formData.prefer_link && (
            <>
              <div className='grid gap-2 pl-2 border-l-2 ml-2'>
                <Label htmlFor='link-description'>Link Description</Label>
                <Input
                  id='link-description'
                  value={formData.link_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      link_description: e.target.value,
                    })
                  }
                  disabled={mutation.isPending}
                />
                <Label htmlFor='expiry'>Link Expires In (Days)</Label>
                <Input
                  id='expiry'
                  type='number'
                  value={formData.link_expires_in_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      link_expires_in_days: parseInt(e.target.value),
                    })
                  }
                  disabled={mutation.isPending}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}