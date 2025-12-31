import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFiles, streamTask, fetchSession } from '@/lib/api'
import {
  Send,
  Sparkles,
  ChevronRight,
  User,
  Bot,
  Loader2,
  LayoutDashboard,
  StopCircle,
  MessageSquare,
  FileText as FileIcon,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { parseStream, type ParsedBlock } from '@/lib/stream-parser'
import { MarkdownFormatter } from '@/components/markdown-formatter'
import { ThinkingProcess } from '@/components/thinking-process'
import { getIconForFile } from '@/lib/file-utils'
import { FilePreview } from '@/components/file-preview'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export const Route = createFileRoute('/session/$sessionId/chat')({
  component: ChatPage,
})

type Message =
  | { id: string; role: 'user'; content: string; timestamp: Date }
  | {
    id: string
    role: 'agent'
    content?: string
    parsed?: ParsedBlock
    timestamp: Date
    isLoading?: boolean
  }

interface RenderableItem {
  type: 'user' | 'bot-simple' | 'bot-complex'
  id: string
  content?: string
  thoughts?: ParsedBlock[]
  finalAnswer?: string
  timestamp: Date
}

function ChatPage() {
  const { sessionId } = Route.useParams()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: 'Hello! I am your data analysis agent. How can I help you today?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { data: files } = useQuery({
    queryKey: ['session-files-mini', sessionId],
    queryFn: () => fetchFiles(sessionId),
  })

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(sessionId),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsStreaming(true)
    setActiveTab('chat')

    abortControllerRef.current = new AbortController()

    let buffer = ''
    try {
      await streamTask(
        sessionId,
        userMsg.content,
        (chunk) => {
          buffer += chunk
          const parsedEvents = parseStream(buffer)
          if (parsedEvents.length > 0) {
            const newAgentMessages: Message[] = parsedEvents.map((p) => ({
              id: crypto.randomUUID(),
              role: 'agent',
              parsed: p,
              timestamp: new Date(),
            }))
            setMessages((prev) => [...prev, ...newAgentMessages])
            buffer = ''
          }
        },
        abortControllerRef.current.signal
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'agent',
          content: 'Sorry, I encountered an error while processing your request.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleCancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedFile) return
    try {
      const { fetchFileContent } = await import('@/lib/api')
      const response = await fetchFileContent(sessionId, undefined, undefined, selectedFile)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedFile
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

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
          timestamp: new Date(), // Using approximate timestamp for grouped items
        })
      } else if (finalAnswer) {
        items.push({
          type: 'bot-complex',
          id: `thought-group-${items.length}`,
          thoughts: [],
          finalAnswer,
          timestamp: new Date(),
        })
      }
      currentThoughtGroup = null
    }

    for (const msg of messages) {
      if (msg.role === 'user') {
        finalizeThoughtGroup()
        items.push({
          type: 'user',
          content: msg.content,
          id: msg.id,
          timestamp: msg.timestamp,
        })
      } else if (msg.role === 'agent') {
        if (!msg.parsed) {
          finalizeThoughtGroup()
          items.push({
            type: 'bot-simple',
            content: msg.content,
            id: msg.id,
            timestamp: msg.timestamp,
          })
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
    <div className='flex flex-col h-full relative overflow-hidden bg-white'>
      {/* Top Header */}
      <header className='h-16 border-b bg-white/50 backdrop-blur-md pl-16 pr-8 flex items-center justify-between sticky top-0 z-30 shrink-0'>
        <div className='flex items-center gap-6'>
          <div className='flex items-center gap-2 text-sm font-medium border-r pr-6'>
            <Link
              to='/dashboard'
              className='text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5'
            >
              <LayoutDashboard className='size-3.5' />
              Dashboard
            </Link>
            <ChevronRight className='size-3.5 text-muted-foreground/50' />
            <span className='font-bold text-foreground opacity-80'>
              Session: {session?.name || sessionId.split('-')[0] + '...'}
            </span>
          </div>

          {selectedFile && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
              <TabsList className="bg-slate-100/80 rounded-xl h-10 p-1">
                <TabsTrigger value="chat" className="rounded-lg px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <MessageSquare className="size-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-lg px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileIcon className="size-3.5" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {selectedFile && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="rounded-xl h-10 px-4 gap-2 border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all font-bold text-xs shrink-0"
          >
            <Download className="size-3.5" />
            Download
          </Button>
        )}
      </header>

      <div className='flex-1 flex overflow-hidden'>
        {/* Left Data Sidebar Sub-pane */}
        <aside className='w-80 border-r bg-slate-50/30 flex flex-col shrink-0 overflow-y-auto hidden lg:flex p-6 space-y-8'>
          <section className='space-y-4'>
            <div className='flex items-center justify-between px-1'>
              <div className='flex items-center gap-2'>
                <h3 className='text-xs font-bold uppercase tracking-widest text-muted-foreground/80'>
                  Files
                </h3>
              </div>
              {files && files.length > 0 && (
                <Badge
                  variant='secondary'
                  className='rounded-full px-2 h-5 bg-primary/5 text-primary text-[10px] border-0'
                >
                  {files.length}
                </Badge>
              )}
            </div>

            <div className='space-y-2'>
              {files?.map((file) => {
                const { Icon, color, bgColor } = getIconForFile(file.name)
                const isSelected = selectedFile === file.name
                return (
                  <div
                    key={file.name}
                    onClick={() => {
                      setSelectedFile(file.name)
                      setActiveTab('preview')
                    }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group',
                      isSelected
                        ? 'bg-primary border-primary shadow-lg shadow-primary/10 text-white'
                        : 'bg-white border-border/40 shadow-sm hover:border-primary/30'
                    )}
                  >
                    <div className={cn(
                      'size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-white/20' : bgColor
                    )}>
                      <Icon className={cn('size-4', isSelected ? 'text-white' : color)} />
                    </div>
                    <div className='flex-1 overflow-hidden'>
                      <p className={cn('text-xs font-bold truncate', isSelected ? 'text-white' : 'text-foreground/70')}>
                        {file.name}
                      </p>
                      <p className={cn('text-[10px] font-semibold', isSelected ? 'text-white/60' : 'text-muted-foreground')}>
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )
              })}
              {(!files || files.length === 0) && (
                <div className='py-8 text-center border-2 border-dashed border-muted rounded-3xl opacity-40'>
                  <p className='text-[10px] font-bold uppercase tracking-widest'>
                    No files
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Chat / Preview Main Area */}
        <main className='flex-1 flex flex-col relative bg-white/40 overflow-hidden'>
          <Tabs value={activeTab} className="h-full flex flex-col">
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
              <div className='flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-hide'>
                {groupedMessages.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex gap-4 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500',
                      item.type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto w-full'
                    )}
                  >
                    <div
                      className={cn(
                        'size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-105',
                        item.type === 'user'
                          ? 'bg-primary text-primary-foreground shadow-primary/20'
                          : 'bg-white border text-primary shadow-slate-100'
                      )}
                    >
                      {item.type === 'user' ? (
                        <User className='size-5' />
                      ) : (
                        <Bot className='size-5' />
                      )}
                    </div>

                    <div
                      className={cn(
                        'group relative space-y-2 flex-1',
                        item.type === 'user'
                          ? 'items-end text-right'
                          : 'items-start text-left'
                      )}
                    >
                      {item.type === 'user' && (
                        <div className='px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium bg-primary text-primary-foreground rounded-tr-none text-left inline-block max-w-[90%]'>
                          <MarkdownFormatter textContent={item.content || ''} />
                        </div>
                      )}

                      {item.type === 'bot-simple' && (
                        <div className='px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium bg-white border border-border/50 text-foreground/80 rounded-tl-none shadow-slate-100 w-full'>
                          <MarkdownFormatter textContent={item.content || ''} />
                        </div>
                      )}

                      {item.type === 'bot-complex' && (
                        <div className='space-y-6 w-full'>
                          {item.thoughts && item.thoughts.length > 0 && (
                            <ThinkingProcess
                              thoughts={item.thoughts}
                              isStreaming={isStreaming && !item.finalAnswer}
                            />
                          )}
                          {item.finalAnswer && (
                            <div className='px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium bg-white border border-border/50 text-foreground/80 rounded-tl-none shadow-slate-100 w-full'>
                              <MarkdownFormatter textContent={item.finalAnswer} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className='flex items-center gap-2 px-1'>
                        <span className='text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest'>
                          {item.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {isStreaming &&
                  !groupedMessages.some(
                    (item) =>
                      item.type === 'bot-complex' || item.type === 'bot-simple'
                  ) && (
                    <div className='flex gap-4 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500'>
                      <div className='size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-white border text-primary shadow-slate-100'>
                        <Bot className='size-5' />
                      </div>
                      <div className='flex-1 px-6 py-4 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex items-center gap-3'>
                        <Loader2 className='size-4 animate-spin text-primary' />
                        <span className='text-sm font-bold uppercase tracking-widest text-muted-foreground/60 animate-pulse'>
                          Agent is thinking...
                        </span>
                      </div>
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Floating Area */}
              <div className='p-8 pt-0 z-20 shrink-0'>
                <div className='max-w-4xl mx-auto bg-white/70 backdrop-blur-2xl border border-border/60 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-200/50 flex items-center gap-3 ring-1 ring-black/5'>
                  <div className='p-2.5 rounded-2xl bg-slate-50 border border-border/40 text-primary/40 hover:text-primary transition-colors cursor-pointer hidden sm:flex'>
                    <Sparkles className='size-5' />
                  </div>

                  <input
                    type='text'
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder='Ask questions about your data...'
                    className='flex-1 bg-transparent px-4 py-2 text-[15px] focus:outline-none placeholder:text-slate-400 font-semibold'
                    disabled={isStreaming}
                  />

                  <div className='flex items-center gap-2'>
                    {isStreaming && (
                      <Button
                        onClick={handleCancelStream}
                        size='icon'
                        variant='ghost'
                        className='size-11 rounded-[1.25rem] text-red-500 hover:text-red-600 hover:bg-red-50 transition-all'
                      >
                        <StopCircle className='size-5' />
                      </Button>
                    )}
                    <Button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isStreaming}
                      size='icon'
                      className='size-11 rounded-[1.25rem] shadow-xl shadow-primary/20 group transition-all duration-300 hover:scale-105 active:scale-95'
                    >
                      {isStreaming ? (
                        <Loader2 className='size-5 animate-spin' />
                      ) : (
                        <Send className='size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {selectedFile && (
              <TabsContent value="preview" className="flex-1 m-0 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                <FilePreview
                  sessionId={sessionId}
                  selectedFile={selectedFile}
                  onClose={() => setActiveTab('chat')}
                  hideHeader={true}
                />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  )
}


