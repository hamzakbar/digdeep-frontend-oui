import { Button } from '@/components/ui/button'
import { Goal, Flag, Share2, X } from 'lucide-react'
import { CheckpointsPanel } from './checkpoints-panel'
import { GoalsPanel } from './goals-panel'
import { SharedPanel } from './shared-panel'
import type { Goal as GoalType } from '@/routes/_authenticated/sessions/$sessionId'

export type ActiveTool = 'goals' | 'checkpoints' | 'shared' | null

interface ToolsPanelProps {
  sessionId: string
  activeTool: NonNullable<ActiveTool>
  onClose: () => void
  onRunTask: (task: string) => Promise<void>
  generatedGoals: GoalType[]
  onSetGeneratedGoals: (goals: GoalType[]) => void
  onCancelExecution: () => void
}

const toolConfig = {
  goals: { icon: Goal, title: 'Goals Management' },
  checkpoints: { icon: Flag, title: 'Checkpoints' },
  shared: { icon: Share2, title: 'Shared Links' },
}

export function ToolsPanel({
  sessionId,
  activeTool,
  onClose,
  ...goalProps
}: ToolsPanelProps) {
  const { icon: Icon, title } = toolConfig[activeTool]

  const renderContent = () => {
    switch (activeTool) {
      case 'goals':
        return <GoalsPanel sessionId={sessionId} {...goalProps} />
      case 'checkpoints':
        return <CheckpointsPanel sessionId={sessionId} />
      case 'shared':
        return <SharedPanel sessionId={sessionId} />
      default:
        return null
    }
  }

  return (
    <div className='h-full flex flex-col ml-2 rounded-2xl'>
      <header className='flex items-center justify-between px-4 py-2 border-b shrink-0'>
        <div className='flex items-center gap-2 font-semibold'>
          <Icon className='h-5 w-5' />
          <span>{title}</span>
        </div>
        <Button variant='ghost' size='icon' onClick={onClose}>
          <X className='h-4 w-4' />
        </Button>
      </header>
      <div className='flex-1 p-4 overflow-y-auto'>{renderContent()}</div>
    </div>
  )
}
