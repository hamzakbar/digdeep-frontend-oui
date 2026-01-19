import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFiles, streamTask, fetchSession } from '@/lib/api'
import {
  Send,
  Sparkles,
  ChevronRight,
  User,
  Bot,
  Loader2,
  StopCircle,
  MessageSquare,
  FileText as FileIcon,
  Download,
  FilePieChart,
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
import { useStreaming } from '@/contexts/streaming-context'

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



export function ChatPage() {
  const { sessionId } = Route.useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const { isStreaming, setIsStreaming } = useStreaming()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const chips = [
    "RED Report for December 2025"
  ]

  useEffect(() => {
    if (messages.length === 0) {
      inputRef.current?.focus()
    }
  }, [messages.length])

  const { data: files } = useQuery({
    queryKey: ['session-files', sessionId],
    queryFn: () => fetchFiles(sessionId),
    refetchInterval: isStreaming ? 10000 : false,
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

  const queryClient = useQueryClient()

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
      // Perform one final fetch to catch any files generated at the very end
      queryClient.invalidateQueries({ queryKey: ['session-files', sessionId] })
    }
  }

  const handleLinkClick = (href: string) => {
    // If href is a relative path or just a filename
    const fileName = href.split('/').pop() || href
    const fileExists = files?.some((f: { name: string }) => f.name === fileName)

    if (fileExists) {
      setSelectedFile(fileName)
      setActiveTab('preview')
      return true // handled
    }
    return false // not handled
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
          timestamp: new Date(),
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
    <div className='flex flex-col h-full relative overflow-hidden bg-background'>
      {/* Top Header */}
      <header className='h-16 border-b bg-background/50 backdrop-blur-md pl-16 pr-8 flex items-center sticky top-0 z-30 shrink-0 w-full'>
        <div className='flex items-center gap-6 flex-1 min-w-0'>
          <div className='flex items-center gap-2 text-sm font-medium border-r pr-6 shrink-0 min-w-0'>
            <Link
              to='/dashboard'
              className='text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 shrink-0'
            >
              Dashboard
            </Link>
            <ChevronRight className='size-3.5 text-muted-foreground/50 shrink-0' />
            <span className='font-bold text-foreground opacity-80 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-md'>
              Session: {session?.name || sessionId}
            </span>
          </div>

          {selectedFile && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto shrink-0">
              <TabsList className="bg-muted/80 rounded-xl h-10 p-1">
                <TabsTrigger value="chat" className="rounded-lg px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="size-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-lg px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
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
        <aside
          className='w-80 border-r flex flex-col shrink-0 overflow-y-auto hidden lg:flex p-6 space-y-8 outline-none'
          tabIndex={0}
        >
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
                        : 'bg-background border-border/40 shadow-sm hover:border-primary/30'
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
        <main className='flex-1 flex flex-col relative bg-background/40 overflow-hidden min-w-0'>
          <Tabs value={activeTab} className="h-full flex flex-col min-w-0 overflow-hidden">
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 min-w-0">
              <div
                className='flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-hide outline-none'
                tabIndex={0}
              >
                {messages.length === 0 && (
                  <div className='flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-1000'>
                    <div className='text-center space-y-6 mb-12'>
                      <div className='size-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-primary/20 relative group'>
                        <div className='absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-ping opacity-20 group-hover:animate-none' />
                        <FilePieChart className='size-10 text-primary animate-pulse relative z-10' />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <span className='text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60'>AI Assistant</span>
                        <h2 className='text-4xl font-black tracking-tighter text-foreground text-center'>
                          Dig <span className="text-primary">Deep</span>
                        </h2>
                      </div>
                      <p className='text-muted-foreground font-medium max-w-lg mx-auto text-lg leading-relaxed px-4'>
                        Analyze your data and extract key insights. I'll help you query records, generate summaries, and visualize trends from your database.
                      </p>
                    </div>

                    <div className='w-full max-w-2xl px-4 space-y-8'>
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-background border border-border/60 rounded-[2.5rem] flex items-center gap-4 p-2 pl-6 shadow-xl">
                          <div className='p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary'>
                            <Sparkles className='size-5' />
                          </div>
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask anything..."
                            className="flex-1 bg-transparent py-4 text-lg focus:outline-none placeholder:text-muted-foreground/40 font-semibold"
                            disabled={isStreaming}
                          />
                          <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isStreaming}
                            className="h-14 w-14 rounded-3xl shadow-lg shadow-primary/20 group transition-all"
                          >
                            <Send className="size-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {chips.map((chip, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInputValue(chip)
                              inputRef.current?.focus()
                            }}
                            className="px-4 py-2 rounded-full border border-border/40 bg-muted/30 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all active:scale-95 duration-200"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
                          : 'bg-card border text-primary shadow-sm'
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
                        'group relative space-y-2 flex-1 min-w-0',
                        item.type === 'user'
                          ? 'items-end text-right'
                          : 'items-start text-left'
                      )}
                    >
                      {item.type === 'user' && (
                        <div className='px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium bg-primary text-primary-foreground rounded-tr-none text-left inline-block max-w-[90%]'>
                          <MarkdownFormatter
                            textContent={item.content || ''}
                            onLinkClick={handleLinkClick}
                          />
                        </div>
                      )}

                      {item.type === 'bot-simple' && (
                        <div className='px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium bg-card border border-border/50 text-foreground/80 rounded-tl-none w-full'>
                          <MarkdownFormatter
                            textContent={item.content || ''}
                            onLinkClick={handleLinkClick}
                          />
                        </div>
                      )}

                      {item.type === 'bot-complex' && (
                        <div className='space-y-6 w-full'>
                          {item.thoughts && item.thoughts.length > 0 && (
                            <ThinkingProcess
                              thoughts={item.thoughts}
                              isStreaming={isStreaming && !item.finalAnswer}
                              onLinkClick={handleLinkClick}
                            />
                          )}
                          {item.finalAnswer && (
                            <div className='px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium bg-card border border-border/50 text-foreground/80 rounded-tl-none w-full'>
                              <MarkdownFormatter
                                textContent={item.finalAnswer}
                                onLinkClick={handleLinkClick}
                              />
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
                      <div className='size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-card border text-primary shadow-sm'>
                        <Bot className='size-5' />
                      </div>
                      <div className='flex-1 px-6 py-4 rounded-3xl bg-muted/50 border border-dashed border-border flex items-center gap-3'>
                        <Loader2 className='size-4 animate-spin text-primary' />
                        <span className='text-sm font-bold uppercase tracking-widest text-muted-foreground/60 animate-pulse'>
                          Agent is thinking...
                        </span>
                      </div>
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </div>

              {messages.length > 0 && (
                <div className='p-8 pt-0 z-20 shrink-0'>
                  <div
                    className={cn(
                      'max-w-4xl mx-auto bg-background/70 backdrop-blur-2xl border border-border/60 rounded-[2.5rem] p-3 shadow-2xl transition-all duration-700 flex items-center gap-3 ring-1 ring-black/5',
                      'shadow-primary/5'
                    )}
                  >
                    <div className='p-2.5 rounded-2xl bg-muted border border-border/40 text-primary/40 hover:text-primary transition-colors cursor-pointer hidden sm:flex'>
                      <Sparkles className='size-5' />
                    </div>

                    <input
                      ref={inputRef}
                      type='text'
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder='Ask a question...'
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
              )}
            </TabsContent>

            {selectedFile && (
              <TabsContent value="preview" className="flex-1 m-0 animate-in slide-in-from-right-4 duration-500 overflow-hidden min-w-0">
                <FilePreview
                  sessionId={sessionId}
                  selectedFile={selectedFile}
                  onClose={() => setActiveTab('chat')}
                  hideHeader={true}
                  onLinkClick={handleLinkClick}
                />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  )
}
