import { Button } from '@/components/ui/button'
import { Goal, Flag, Share2 } from 'lucide-react'
import { type ActiveTool } from './tools-panel'

interface ToolsSidebarProps {
  activeTool: ActiveTool
  onToolSelect: (tool: NonNullable<ActiveTool>) => void
}

const tools = [
  { id: 'goals', icon: Goal, label: 'Goals' },
  { id: 'checkpoints', icon: Flag, label: 'Checkpoints' },
  { id: 'shared', icon: Share2, label: 'Shared Links' },
] as const

export function ToolsSidebar({ activeTool, onToolSelect }: ToolsSidebarProps) {
  return (
    <div className='flex flex-col items-center gap-4 p-2 border-r bg-muted/20 h-full'>
      {tools.map((tool) => (
        <Button
          key={tool.id}
          variant={activeTool === tool.id ? 'secondary' : 'ghost'}
          size='icon'
          onClick={() => onToolSelect(tool.id)}
          aria-label={tool.label}
        >
          <tool.icon className='h-5 w-5' />
        </Button>
      ))}
    </div>
  )
}