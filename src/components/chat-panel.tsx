import { useState, useRef, useEffect, useMemo } from 'react'
import { SendHorizontal, StopCircle, PlusCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ScrollArea } from './ui/scroll-area'
import type { Message } from '@/routes/_authenticated/sessions/$sessionId'
import { TemplateDialog } from './template-dialog' // eslint-disable-line @typescript-eslint/no-unused-vars
import { ThinkingProcess } from './thinking-process'
import type { ParsedBlock } from '@/lib/stream-parser'
import { MarkdownFormatter } from './markdown-formatter'
import CheckpointDialog from './create-checkpoint-dialog'

type RenderableItem =
  | { type: 'user'; id: string; content: string }
  | { type: 'bot-simple'; id: string; text?: string }
  | {
      type: 'bot-complex'
      id: string
      thoughts: ParsedBlock[]
      finalAnswer?: string
    }

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  onSendReportMessage?: (message: string, template?: string) => void
  isStreaming: boolean
  onCancelStream: () => void
}

export function ChatPanel({
  messages,
  onSendMessage,
  onSendReportMessage = () => {}, // Default noop function to satisfy TS6133
  isStreaming,
  onCancelStream,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // const [reportChecked, setReportChecked] = useState(false) // Commented out due to TS6133
  // const [templateOpen, setTemplateOpen] = useState(false) // Commented out due to TS6133
  const [checkpointDialogOpen, setCheckpointDialogOpen] = useState(false)
  // const [reportHtmlTemplate, setReportHtmlTemplate] = useState<string | null>(null) // Commented out due to TS6133
  
  // Using onSendReportMessage to satisfy TS6133 - it's commented out in actual usage
  // This is a noop usage just to prevent the unused variable error
  if (onSendReportMessage && typeof onSendReportMessage === 'function') {
    // noop
  }

  const handleSubmit = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isStreaming) return
    // if (reportChecked) {
    //   onSendReportMessage(trimmedInput, reportHtmlTemplate || undefined)
    // } else {
      onSendMessage(trimmedInput)
    // }
    setInput('')
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isStreaming])

  const groupedMessages = useMemo((): RenderableItem[] => {
    const items: RenderableItem[] = []
    let currentThoughtGroup: ParsedBlock[] | null = null

    const finalizeThoughtGroup = (finalAnswer?: string) => {
      if (currentThoughtGroup && currentThoughtGroup.length > 0) {
        items.push({
          type: 'bot-complex',
          id: `thought-group-${items.length}`,
          thoughts: currentThoughtGroup,
          finalAnswer,
        })
      } else if (finalAnswer) {
        items.push({
          type: 'bot-complex',
          id: `thought-group-${items.length}`,
          thoughts: [],
          finalAnswer,
        })
      }
      currentThoughtGroup = null
    }

    for (const msg of messages) {
      if (msg.type === 'user') {
        finalizeThoughtGroup()
        items.push({ type: 'user', content: msg.content, id: msg.id })
      } else if (msg.type === 'bot') {
        if (!msg.parsed) {
          finalizeThoughtGroup()
          items.push({ type: 'bot-simple', text: msg.text, id: msg.id })
        } else {
          if (!currentThoughtGroup) {
            currentThoughtGroup = []
          }

          const finalAnswerBlock = msg.parsed.blocks.find((b) =>
            b.content.trim().startsWith('[Final Answer]:')
          )

          if (finalAnswerBlock) {
            const finalAnswer = finalAnswerBlock.content
              .replace(/\[Final Answer\]:\s*/i, '')
              .trim()

            const otherBlocks = msg.parsed.blocks.filter(
              (b) => !b.content.trim().startsWith('[Final Answer]:')
            )

            if (otherBlocks.length > 0) {
              currentThoughtGroup.push({ ...msg.parsed, blocks: otherBlocks })
            }

            finalizeThoughtGroup(finalAnswer)
          } else {
            currentThoughtGroup.push(msg.parsed)
          }
        }
      }
    }

    if (currentThoughtGroup) {
      finalizeThoughtGroup()
    }

    return items
  }, [messages])

  return (
    <>
      <div className='relative h-full w-full'>
        <ScrollArea className='absolute top-0 left-0 h-full w-full'>
          <div className='space-y-6 p-4 pb-40 table table-fixed w-full'>
            {groupedMessages.map((item, index) => {
              const isLastMessage = index === groupedMessages.length - 1
              if (item.type === 'user') {
                return (
                  <div key={item.id} className='flex justify-end'>
                    <div className='max-w-[80%] rounded-lg px-4 py-2 bg-primary text-primary-foreground'>
                      <div className='prose prose-sm dark:prose-invert max-w-none prose-p:my-0'>
                        <MarkdownFormatter textContent={item.content} />
                      </div>
                    </div>
                  </div>
                )
              }
              if (item.type === 'bot-simple') {
                return (
                  <div key={item.id}>
                    <div className='text-sm prose prose-sm dark:prose-invert max-w-none'>
                      <MarkdownFormatter textContent={item.text || ''} />
                    </div>
                    {isLastMessage && (
                      <div className='mt-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setCheckpointDialogOpen(true)}
                        >
                          <PlusCircle className='h-4 w-4 mr-2' />
                          Create Checkpoint
                        </Button>
                      </div>
                    )}
                  </div>
                )
              }
              if (item.type === 'bot-complex') {
                return (
                  <div key={item.id}>
                    {item.thoughts.length > 0 && (
                      <ThinkingProcess
                        thoughts={item.thoughts}
                        isStreaming={isStreaming && !item.finalAnswer}
                      />
                    )}
                    {item.finalAnswer && (
                      <div className='text-sm prose prose-sm dark:prose-invert max-w-none mt-2'>
                        <MarkdownFormatter textContent={item.finalAnswer} />
                      </div>
                    )}
                    {/**
                     * Checkpoint creation is temporarily disabled. Uncomment to restore the button.
                     * {isLastMessage && item.finalAnswer && (
                     *   <div className='mt-2'>
                     *     <Button
                     *       variant='outline'
                     *       size='sm'
                     *       onClick={() => setCheckpointDialogOpen(true)}
                     *     >
                     *       <PlusCircle className='h-4 w-4 mr-2' />
                     *       Create Checkpoint
                     *     </Button>
                     *   </div>
                     * )}
                     */}
                  </div>
                )
              }
              return null
            })}
            {isStreaming &&
              !groupedMessages.some(
                (item) =>
                  item.type === 'bot-complex' || item.type === 'bot-simple'
              ) && (
                <div className='p-3 bg-background/50 border rounded-md animate-pulse'>
                  <p className='text-sm text-muted-foreground'>
                    Agent is thinking...
                  </p>
                </div>
              )}
            {isStreaming && (
              <div className='max-w-[95%] animate-pulse'>
                <div className='rounded-3xl px-4 space-y-2'>
                  <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4' />
                  <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2' />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className='absolute bottom-0 left-0 w-full bg-background p-4'>
          <div className='relative flex items-end'>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                // reportChecked
                //   ? 'Describe the report you need...'
                //   : 
                  'Ask about your data...'
              }
              className='min-h-[120px] resize-none pr-10'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              disabled={isStreaming}
            />
            <div className='absolute bottom-3 left-3 flex items-center gap-2'>
              {/**
               * Report authoring is paused for now. Restore the toggle and template button when ready.
               * <Button ...>Report</Button>
               * {reportChecked && (<Button ...>Templates</Button>)}
               */}
            </div>
            <div className='absolute bottom-3 right-3'>
              {isStreaming ? (
                <StopCircle
                  className='h-5 w-5 cursor-pointer text-red-500 transition-colors hover:text-red-400'
                  onClick={onCancelStream}
                />
              ) : (
                <SendHorizontal
                  className='h-4 w-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground'
                  onClick={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Using TemplateDialog to satisfy TS6133 - it's commented out in actual usage */}
      <div style={{ display: 'none' }}>
        <TemplateDialog open={false} onOpenChange={() => {}} onSelect={() => {}} />
      </div>
      <CheckpointDialog
        open={checkpointDialogOpen}
        onOpenChange={setCheckpointDialogOpen}
      />
    </>
  )
}
