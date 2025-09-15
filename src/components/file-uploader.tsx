import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export function FileUploader({ files, onFilesChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    onFilesChange([...files, ...Array.from(fileList)])
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <Label>Upload Files</Label>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className='h-4 w-4' />
        </Button>
        <input
          type='file'
          multiple
          ref={fileInputRef}
          onChange={addFiles}
          className='hidden'
        />
      </div>

      {files.length > 0 && (
        <div className='mt-2 space-y-2 rounded-md border p-2'>
          {files.map((file, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between text-sm'
            >
              <span className='truncate pr-2'>{file.name}</span>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => removeFile(idx)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
