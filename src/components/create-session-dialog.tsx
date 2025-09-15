import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
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
import { ScrollArea } from './ui/scroll-area'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { FileUploader } from './file-uploader'
import { startSession, uploadSessionData, clarifySession } from '@/lib/api'
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
        return { questions: [], sessionId: newSessionId }
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
          {/* <PlusCircle className='mr-2 h-4 w-4' />  */}
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
                        <SelectTrigger id={field.name} className='w-full'>
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
                      <Label htmlFor={field.name}>
                        Data Context (Optional)
                      </Label>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Describe your data and analysis goals...'
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name='data_sources'>
                  {(field) => (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <Label>Data Sources</Label>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          onClick={() =>
                            field.pushValue({
                              id: uuidv4(),
                              type: 'url',
                              value: '',
                            })
                          }
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      </div>
                      {field.state.value.map((ds, index) => (
                        <div key={ds.id} className='flex items-center gap-2'>
                          <Select
                            value={ds.type}
                            onValueChange={(newType: 'url' | 'db') =>
                              field.setValue(
                                field.state.value.map((item) =>
                                  item.id === ds.id
                                    ? { ...item, type: newType }
                                    : item
                                )
                              )
                            }
                          >
                            <SelectTrigger className='w-[100px]'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='url'>URL</SelectItem>
                              <SelectItem value='db'>DB</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={ds.value}
                            onChange={(e) =>
                              field.setValue(
                                field.state.value.map((item) =>
                                  item.id === ds.id
                                    ? { ...item, value: e.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder={
                              ds.type === 'url'
                                ? 'https://...'
                                : 'postgresql://...'
                            }
                            className='flex-1'
                          />
                          <Button
                            type='button'
                            size='icon'
                            variant='ghost'
                            onClick={() => field.removeValue(index)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name='files'
                  children={(field) => (
                    <FileUploader
                      files={field.state.value}
                      onFilesChange={field.handleChange}
                    />
                  )}
                />
              </div>
            ) : (
              <ClarificationStep
                formQuestions={formQuestions}
                onAnswerChange={handleAnswerChange}
              />
            )}
          </ScrollArea>

          <DialogFooter>
            {step === 'clarification' && (
              <Button
                type='button'
                variant='outline'
                onClick={() => setStep('setup')}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            <Button type='submit' disabled={isLoading} className='ml-auto'>
              {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
              {step === 'setup'
                ? 'Create & Continue'
                : 'Submit & Start Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
