import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { startSession } from '@/lib/api'

/*
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { Textarea } from './ui/textarea'
import { FileUploader } from './file-uploader'
import { ClarificationStep, type QuestionBlock } from './clarification-step'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const models = [
  { value: 'gpt-4.1', label: 'GPT 4.1' },
  { value: 'gpt-4.1-mini', label: 'GPT 4.1 mini' },
  { value: 'gpt-4.1-nano', label: 'GPT 4.1 nano' },
]

type Step = 'setup' | 'clarification'

type DataSource = {
  id: string
  type: 'url' | 'db'
  value: string
}

type StartSessionVariables = {
  name: string
  data_context: string
  files: File[]
  data_sources: DataSource[]
  model: string
}

type StartSessionData = {
  questions: QuestionBlock[]
  sessionId: string
}
*/

interface StartSessionResponse {
  session_id?: string
  message?: string
}

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  /*
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('setup')
  const [sessionId, setSessionId] = useState('')
  const [formQuestions, setFormQuestions] = useState<QuestionBlock[]>([])
  */

  const form = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: async ({ value }) => {
      startSessionMutation.mutate(value)
    },
  })

  /*
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStep('setup')
        setSessionId('')
        setFormQuestions([])
        form.reset()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open, form])
  */

  const startSessionMutation = useMutation<
    StartSessionResponse,
    Error,
    { name: string }
  >({
    mutationFn: startSession,
    onSuccess: (data, variables) => {
      if (!data?.session_id) {
        toast.error('Session created, but no session id was returned.')
        return
      }

      toast.success(
        data.message || `Session "${variables.name || 'Untitled'}" created!`
      )
      form.reset()
      setOpen(false)
      navigate({
        to: '/sessions/$sessionId',
        params: { sessionId: data.session_id },
      })
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const isLoading = startSessionMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Session</Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>Create a New Session</DialogTitle>
            <DialogDescription>
              Give your session a descriptive name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className='my-6 space-y-6'>
            <form.Field
              name='name'
              validators={{
                onBlur: ({ value }) =>
                  !value ? 'Session name is required' : undefined,
              }}
            >
              {(field) => (
                <div className='grid gap-2'>
                  <Label htmlFor={field.name}>Session Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='e.g., Q4 Financial Analysis'
                    disabled={isLoading}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <em className='text-destructive text-sm'>
                      {field.state.meta.errors.join(', ')}
                    </em>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              type='button'
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/*
export function CreateSessionDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('setup')
  const [sessionId, setSessionId] = useState('')
  const [formQuestions, setFormQuestions] = useState<QuestionBlock[]>([])

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      name: '',
      data_context: '',
      files: [] as File[],
      data_sources: [] as DataSource[],
      model: 'gpt-4.1',
    },
    onSubmit: async ({ value }) => {
      if (step === 'setup') {
        startSessionMutation.mutate(value)
      } else {
        clarifySessionMutation.mutate()
      }
    },
  })

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStep('setup')
        setSessionId('')
        setFormQuestions([])
        form.reset()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open, form])

  const finishAndNavigate = (id: string, name: string) => {
    toast.success(`Session "${name || 'Untitled'}" created!`)
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    setOpen(false)
    navigate({
      to: '/sessions/$sessionId',
      params: { sessionId: id },
    })
  }

  const startSessionMutation = useMutation<
    StartSessionData,
    Error,
    StartSessionVariables
  >({
    mutationFn: async (values) => {
      const newSessionId = uuidv4()
      setSessionId(newSessionId)

      await startSession({
        session_id: newSessionId,
        name: values.name,
        data_context: values.data_context,
        model: values.model,
      })

      const filteredDataSources = values.data_sources.filter(
        (ds) => ds.value.trim() !== ''
      )
      const hasDataToUpload =
        values.files.length > 0 || filteredDataSources.length > 0

      if (!hasDataToUpload) {
        return {
          questions: [],
          sessionId: newSessionId,
        }
      }

      const formData = new FormData()
      values.files.forEach((f) => formData.append('files', f))

      if (filteredDataSources.length > 0) {
        const sourcesPayload = {
          sources: filteredDataSources.map((ds) => ({
            type: ds.type,
            link: ds.type === 'url' ? ds.value : undefined,
            connection_string: ds.type === 'db' ? ds.value : undefined,
            queries: ds.type === 'db' ? [] : undefined,
          })),
        }
        formData.append('data_sources', JSON.stringify(sourcesPayload))
      } else {
        formData.append('data_sources', '{}')
      }

      const uploadRes = await uploadSessionData(newSessionId, formData)
      return {
        questions: uploadRes.form?.questions ?? [],
        sessionId: newSessionId,
      }
    },
    onSuccess: ({ questions, sessionId: newSessionId }, variables) => {
      if (questions && questions.length > 0) {
        setFormQuestions(
          questions.map((q) => ({
            ...q,
            answers: q.answers || Array(q.questions.length).fill(''),
          }))
        )
        setStep('clarification')
      } else {
        finishAndNavigate(newSessionId, variables.name)
      }
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const clarifySessionMutation = useMutation({
    mutationFn: async () => {
      const clarMap: Record<string, string> = {}
      formQuestions.forEach((blk) =>
        blk.questions.forEach((q, i) => {
          clarMap[q] = blk.answers[i] || ''
        })
      )
      await clarifySession(sessionId, clarMap)
    },
    onSuccess: () => finishAndNavigate(sessionId, form.state.values.name),
    onError: (err) => toast.error(`Clarification failed: ${err.message}`),
  })

  const handleAnswerChange = (
    blockIndex: number,
    questionIndex: number,
    value: string
  ) => {
    setFormQuestions((prev) => {
      const newQuestions = JSON.parse(JSON.stringify(prev))
      newQuestions[blockIndex].answers[questionIndex] = value
      return newQuestions
    })
  }

  const isLoading =
    startSessionMutation.isPending || clarifySessionMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Create Session
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl flex flex-col'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {step === 'setup' ? 'Create a New Session' : 'Clarification Form'}
            </DialogTitle>
            <DialogDescription>
              {step === 'setup'
                ? 'Provide details and upload data for your new session.'
                : 'Answer a few questions so we can better understand your data.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='max-h-[70vh] my-4 overflow-auto'>
            {step === 'setup' ? (
              <div className='space-y-6'>
                <form.Field
                  name='name'
                  validators={{
                    onBlur: ({ value }) =>
                      !value ? 'Session name is required' : undefined,
                  }}
                >
                  {(field) => (
                    <div className='grid gap-2'>
                      <Label htmlFor={field.name}>Session Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='e.g., Q4 Financial Analysis'
                      />
                      {field.state.meta.errors.length > 0 && (
                        <em className='text-destructive text-sm'>
                          {field.state.meta.errors.join(', ')}
                        </em>
                      )}
                    </div>
                  )}
                </form.Field>
                <form.Field name='model'>
                  {(field) => (
                    <div className='grid gap-2'>
                      <Label htmlFor={field.name}>Model</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder='Select a model' />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
                <form.Field name='data_context'>
                  {(field) => (
                    <div className='grid gap-2'>
                      <Label htmlFor={field.name}>Context (Optional)</Label>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Provide any background or context for this session.'
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name='files'>
                  {(field) => (
                    <div className='grid gap-2'>
                      <Label>Upload Files</Label>
                      <FileUploader
                        files={field.state.value}
                        onFilesChange={field.handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name='data_sources'>
                  {(field) => (
                    <div className='grid gap-2'>
                      <Label>External Data Sources</Label>
                      <DataSourceList
                        sources={field.state.value}
                        onChange={field.handleChange}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            ) : (
              <ClarificationStep
                questions={formQuestions}
                onAnswerChange={handleAnswerChange}
                isSubmitting={clarifySessionMutation.isPending}
              />
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {step === 'setup' ? 'Create Session' : 'Submit Clarification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
*/
