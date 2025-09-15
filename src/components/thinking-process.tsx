import { useState, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { ParsedBlock } from '@/lib/stream-parser'
import { ThoughtBlock } from './thought-block'

interface ThinkingProcessProps {
  thoughts: ParsedBlock[]
  isStreaming: boolean
}

export function ThinkingProcess({
  thoughts,
  isStreaming,
}: ThinkingProcessProps) {
  const [openValue, setOpenValue] = useState(
    isStreaming ? 'thought-process' : ''
  )

  const triggerText = isStreaming ? 'Thinking...' : 'Show thought process'

  useEffect(() => {
    if (isStreaming) {
      setOpenValue('thought-process')
    } else {
      setOpenValue('')
    }
  }, [isStreaming])

  return (
    <Accordion
      type='single'
      collapsible
      className='w-full'
      value={openValue}
      onValueChange={setOpenValue}
    >
      <AccordionItem value='thought-process' className='border-b-0'>
        <AccordionTrigger className='py-2 text-sm font-semibold text-muted-foreground hover:no-underline'>
          {triggerText}
        </AccordionTrigger>
        <AccordionContent>
          <div className='pl-2 space-y-4 pt-2 border-l'>
            {thoughts.map((thought, i) => (
              <ThoughtBlock key={i} parsed={thought} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
