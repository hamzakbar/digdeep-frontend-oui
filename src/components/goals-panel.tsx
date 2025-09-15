import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { generateGoals } from '@/lib/api'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Loader2, Wand2, FileQuestion, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Goal } from '@/routes/_authenticated/sessions/$sessionId'
import { cn } from '@/lib/utils'

type Status = 'pending' | 'running' | 'completed' | 'failed'

interface GoalsPanelProps {
  sessionId: string
  onRunTask: (task: string) => Promise<void>
  generatedGoals: Goal[]
  onSetGeneratedGoals: (goals: Goal[]) => void
  onCancelExecution: () => void
}

export function GoalsPanel({
  sessionId,
  onRunTask,
  generatedGoals,
  onSetGeneratedGoals,
  onCancelExecution,
}: GoalsPanelProps) {
  const [goal, setGoal] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState(new Set<number>())
  const [executionStatus, setExecutionStatus] = useState<
    Record<number, Status>
  >({})
  const [runQueue, setRunQueue] = useState<number[]>([])
  const [currentRunIndex, setCurrentRunIndex] = useState(0)
  const stopExecutionRef = useRef(false)

  const generateMutation = useMutation({
    mutationFn: generateGoals,
    onSuccess: (data) => {
      const kpis =
        data.tasks?.complex_kpis?.map((item: { kpi_name: string; description: string }) => ({
          title: item.kpi_name,
          description: item.description,
        })) || []
      onSetGeneratedGoals(kpis)
      setExecutionStatus({})
      setSelectedGoals(new Set())
      toast.success(`${kpis.length} goals generated!`)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleGenerate = () => {
    if (!goal.trim()) {
      toast.error('Please enter a goal first.')
      return
    }
    generateMutation.mutate({ sessionId, goal })
  }

  const handleRunBatch = async () => {
    let goalsToRun: number[]

    if (selectedGoals.size > 0) {
      goalsToRun = Array.from(selectedGoals).sort((a, b) => a - b)
    } else {
      goalsToRun = generatedGoals.map((_, index) => index)
    }

    if (goalsToRun.length === 0) {
      toast.info('No goals to execute.')
      return
    }

    setIsExecuting(true)
    setRunQueue(goalsToRun)
    setCurrentRunIndex(0)
    stopExecutionRef.current = false

    const initialStatus: Record<number, Status> = {}
    goalsToRun.forEach((index) => {
      initialStatus[index] = 'pending'
    })
    setExecutionStatus((prev) => ({ ...prev, ...initialStatus }))

    try {
      for (let i = 0; i < goalsToRun.length; i++) {
        const goalIndex = goalsToRun[i]
        setCurrentRunIndex(i + 1)

        if (stopExecutionRef.current) {
          toast.info('Execution stopped by user.')
          break
        }
        await runSingleGoal(goalIndex)
      }
    } catch (error) {
      console.error('Batch execution halted:', error)
    } finally {
      setIsExecuting(false)
      setSelectedGoals(new Set())
      setRunQueue([])
    }
  }

  const runSingleGoal = async (index: number) => {
    setExecutionStatus((prev) => ({ ...prev, [index]: 'running' }))
    const currentGoal = generatedGoals[index]
    const runToastId = toast.loading(`Running: ${currentGoal.title}`)

    try {
      await onRunTask(currentGoal.description)
      toast.success(`Completed: ${currentGoal.title}`, { id: runToastId })
      setExecutionStatus((prev) => ({ ...prev, [index]: 'completed' }))
    } catch (error) {
      setExecutionStatus((prev) => ({ ...prev, [index]: 'failed' }))
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('Execution stopped.', { id: runToastId })
      } else {
        toast.error(`Error on goal: ${currentGoal.title}`, { id: runToastId })
      }
      throw error
    }
  }

  const handleRunIndividualGoal = async (index: number) => {
    setIsExecuting(true)
    try {
      await runSingleGoal(index)
    } catch (error) {
      console.error('Individual goal run failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleStopExecution = () => {
    stopExecutionRef.current = true
    onCancelExecution()
  }

  const handleToggleSelection = (index: number) => {
    const newSelection = new Set(selectedGoals)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedGoals(newSelection)
  }

  return (
    <div className='space-y-6'>
      <div className='relative'>
        <Textarea
          placeholder='Enter your main analysis goal...'
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
          disabled={generateMutation.isPending || isExecuting}
          className='pr-12'
        />
        <Button
          size='icon'
          className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8'
          onClick={handleGenerate}
          disabled={generateMutation.isPending || isExecuting}
        >
          {generateMutation.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Wand2 className='h-4 w-4' />
          )}
        </Button>
      </div>

      {generatedGoals.length > 0 ? (
        <div className='space-y-4'>
          <div className='flex flex-col items-center gap-2'>
            {isExecuting ? (
              <Button
                size='sm'
                variant='destructive'
                onClick={handleStopExecution}
                className='w-full'
              >
                <Loader2 className='h-4 w-4 animate-spin' />
                Stop Execution
              </Button>
            ) : (
              <Button
                size='sm'
                onClick={handleRunBatch}
                className='w-full'
                disabled={generateMutation.isPending}
              >
                {selectedGoals.size > 0
                  ? `Run ${selectedGoals.size} Selected Goal${
                      selectedGoals.size !== 1 ? 's' : ''
                    }`
                  : 'Run All Goals'}
              </Button>
            )}
          </div>

          {isExecuting && runQueue.length > 0 && (
            <div className='text-sm font-medium text-center text-muted-foreground'>
              Executing Goal {currentRunIndex} of {runQueue.length}
            </div>
          )}

          <Accordion type='single' collapsible className='w-full'>
            {generatedGoals.map((g, index) => {
              const status = executionStatus[index] || 'pending'
              const isSelected = selectedGoals.has(index)

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={cn(
                    status === 'completed' && !isSelected && 'opacity-60'
                  )}
                >
                  <AccordionTrigger
                    className='text-left group'
                    disabled={isExecuting}
                  >
                    <div className='flex items-center gap-3 flex-1'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleSelection(index)
                        }}
                        disabled={isExecuting}
                        className={cn(
                          'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground group-hover:border-primary',
                          isExecuting &&
                            'opacity-50 cursor-not-allowed group-hover:border-muted-foreground'
                        )}
                        aria-label={`Select goal ${index + 1}`}
                      >
                        {isSelected && (
                          <Check className='h-3 w-3 text-primary-foreground' />
                        )}
                      </button>
                      <span className='flex-1'>{g.title}</span>
                      {status === 'running' && (
                        <Loader2 className='h-4 w-4 animate-spin text-primary' />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='pt-2 pb-4 space-y-4 pl-7'>
                    <p className='text-sm text-muted-foreground'>
                      {g.description}
                    </p>
                    <Button
                      size='sm'
                      onClick={() => handleRunIndividualGoal(index)}
                      disabled={isExecuting}
                    >
                      Run This Goal
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      ) : (
        !generateMutation.isPending && (
          <div className='flex flex-col items-center justify-center text-center text-muted-foreground py-10 space-y-4'>
            <FileQuestion className='h-12 w-12' />
            <p className='font-medium'>No Goals Generated Yet</p>
            <p className='text-sm'>
              Enter your main analysis objective above and click the wand to
              generate goal suggestions.
            </p>
          </div>
        )
      )}
    </div>
  )
}
