import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { duplicateSession } from '@/lib/api'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface DuplicateSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionName?: string | null
}

const DEFAULT_OPTIONS = {
  include_memory: false,
  include_files: false,
  include_form: true,
  include_clarifications: true,
  include_metadata: true,
}

export function DuplicateSessionDialog({
  open,
  onOpenChange,
  sessionId,
  sessionName,
}: DuplicateSessionDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [options, setOptions] = useState({ ...DEFAULT_OPTIONS })

  const mutation = useMutation({
    mutationFn: () => duplicateSession(sessionId, name, options),
    onSuccess: () => {
      toast.success('Session duplicated successfully.')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Duplication failed: ${error.message}`)
    },
  })

  const handleCheckboxChange = (key: keyof typeof DEFAULT_OPTIONS) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleDuplicate = () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the new session.')
      return
    }
    mutation.mutate()
  }

  useEffect(() => {
    if (open) {
      setName(sessionName ? `${sessionName} (Copy)` : 'Untitled Session (Copy)')
      setOptions({ ...DEFAULT_OPTIONS })
    }
  }, [open, sessionName])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Session</DialogTitle>
          <DialogDescription>
            Create a copy of this session with a new name and select the data
            you want to include.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='copy-name'>New Session Name</Label>
            <Input
              id='copy-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending}
              placeholder='Enter a name for the duplicated session'
            />
          </div>
          <div className='space-y-2'>
            <Label>Copy Options</Label>
            <div className='flex flex-col gap-2 mt-2 rounded-md border p-4'>
              {Object.entries(options).map(([key, value]) => (
                <div key={key} className='flex items-center gap-2'>
                  <Checkbox
                    checked={value}
                    onCheckedChange={() =>
                      handleCheckboxChange(key as keyof typeof DEFAULT_OPTIONS)
                    }
                    disabled={mutation.isPending}
                    id={key}
                  />
                  <Label htmlFor={key} className='capitalize font-normal'>
                    {`Include ${key.replace('_', ' ')}`}
                  </Label>
                </div>
              ))}
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
            onClick={handleDuplicate}
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}