import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFiles, streamTask } from '@/lib/api'
import {
  Send,
  Sparkles,
  ChevronRight,
  User,
  Bot,
  FileText,
  Loader2,
  LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/session/$sessionId/chat')({
  component: ChatPage,
})

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  isLoading?: boolean
  files?: string[]
}

function ChatPage() {
  const { sessionId } = Route.useParams()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: 'Hello! I am your data analysis agent. How can I help you today?',
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: files } = useQuery({
    queryKey: ['session-files-mini', sessionId],
    queryFn: () => fetchFiles(sessionId),
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
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsStreaming(true)

    setMessages(prev => [...prev, {
      role: 'agent',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }])

    let currentResponse = ''
    const controller = new AbortController()

    try {
      await streamTask(
        sessionId,
        userMsg.content,
        (chunk) => {
          currentResponse += chunk
          setMessages(prev => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last.role === 'agent') {
              last.content = currentResponse
              last.isLoading = false
            }
            return next
          })
        },
        controller.signal
      )
    } catch (err) {
      console.error(err)
      setMessages(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last.role === 'agent') {
          last.content = 'Sorry, I encountered an error while processing your request.'
          last.isLoading = false
        }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white">
      {/* Top Header */}
      <header className="h-16 border-b bg-white/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="font-bold text-foreground opacity-80">Session: {sessionId.split('-')[0]}...</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Data Sidebar Sub-pane */}
        <aside className="w-80 border-r bg-slate-50/30 flex flex-col shrink-0 overflow-y-auto hidden lg:flex p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary opacity-60" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Files</h3>
              </div>
              {files && files.length > 0 && (
                <Badge variant="secondary" className="rounded-full px-2 h-5 bg-primary/5 text-primary text-[10px] border-0">{files.length}</Badge>
              )}
            </div>

            <div className="space-y-2">
              {files?.map(file => (
                <div key={file.name} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border/40 shadow-sm hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="size-8 rounded-xl bg-primary/5 flex items-center justify-center">
                    <FileText className="size-4 text-primary opacity-60" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold truncate text-foreground/70">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
              {(!files || files.length === 0) && (
                <div className="py-8 text-center border-2 border-dashed border-muted rounded-3xl opacity-40">
                  <p className="text-[10px] font-bold uppercase tracking-widest">No files</p>
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Chat Messages Hub */}
        <main className="flex-1 flex flex-col relative bg-white/40">
          <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-4 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}>
                <div className={cn(
                  "size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-105",
                  msg.role === 'user' ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-white border text-primary shadow-slate-100"
                )}>
                  {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
                </div>

                <div className={cn(
                  "group relative space-y-2",
                  msg.role === 'user' ? "items-end text-right" : "items-start text-left"
                )}>
                  <div className={cn(
                    "px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium transition-all",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white border border-border/50 text-foreground/80 rounded-tl-none shadow-slate-100"
                  )}>
                    {msg.isLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="size-4 animate-spin opacity-50" />
                        <span className="opacity-70 animate-pulse">Agent is thinking...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Floating Area */}
          <div className="p-8 pt-0 z-20 shrink-0">
            <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-2xl border border-border/60 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-200/50 flex items-center gap-3 ring-1 ring-black/5">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-border/40 text-primary/40 hover:text-primary transition-colors cursor-pointer hidden sm:flex">
                <Sparkles className="size-5" />
              </div>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask questions about your data..."
                className="flex-1 bg-transparent px-4 py-2 text-[15px] focus:outline-none placeholder:text-slate-400 font-semibold"
                disabled={isStreaming}
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isStreaming}
                  size="icon"
                  className="size-11 rounded-[1.25rem] shadow-xl shadow-primary/20 group transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {isStreaming ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Send className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
