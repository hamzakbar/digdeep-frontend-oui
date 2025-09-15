import { useState, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useIsMutating } from '@tanstack/react-query'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ChatPanel } from '@/components/chat-panel'
import { FileViewerPanel } from '@/components/file-viewer-panel'
import { ToolsSidebar } from '@/components/tools-sidebar'
import {
  fetchSessionById,
  streamTask,
  streamReportTask,
  fetchFileContent,
} from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFound } from '@/components/not-found'
import { parseStream, type ParsedBlock } from '@/lib/stream-parser'
import { ToolsPanel, type ActiveTool } from '@/components/tools-panel'
import { Button } from '@/components/ui/button'
import { FileShareDialog } from '@/components/file-share-dialog'
import { FileEmailDialog } from '@/components/file-email-dialog'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type Message =
  | { id: string; type: 'user'; content: string }
  | { id: string; type: 'bot'; text?: string; parsed?: ParsedBlock }
export interface Goal {
  title: string
  description: string
}

export const Route = createFileRoute('/_authenticated/sessions/$sessionId')({
  loader: ({ params }) =>
    fetchSessionById(params.sessionId).catch((error) => {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('not found')
      ) {
        throw error
      }
      throw new Error('Could not load session.')
    }),
  errorComponent: ({ error }) => {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('not found')
    ) {
      return <NotFound resource='session' />
    }
    return <div>An unexpected error occurred: {error.message}</div>
  },
  pendingComponent: SessionSkeleton,
  component: SessionComponent,
})

function SessionSkeleton() {
  return (
    <div className='h-screen w-screen flex flex-col overflow-hidden'>
      <header className='flex items-center h-14 px-4 shrink-0'>
        <Skeleton className='h-6 w-24' />
        <div className='mx-auto'>
          <Skeleton className='h-6 w-48' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-24 rounded-md' />
          <Skeleton className='h-9 w-24 rounded-md' />
          <Skeleton className='h-9 w-28 rounded-md' />
        </div>
      </header>
      <div className='flex-1 flex overflow-hidden'>
        <ResizablePanelGroup direction='horizontal' className='flex-1'>
          <ResizablePanel defaultSize={35} minSize={25} className='p-4'>
            <Skeleton className='h-full w-full' />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30} className='p-4'>
            <Skeleton className='h-full w-full' />
          </ResizablePanel>
        </ResizablePanelGroup>
        <div className='h-full bg-background border-l p-2 flex flex-col items-center gap-2'>
          <Skeleton className='h-10 w-10 rounded-md' />
          <Skeleton className='h-10 w-10 rounded-md' />
          <Skeleton className='h-10 w-10 rounded-md' />
        </div>
      </div>
    </div>
  )
}

function SessionComponent() {
  const initialData = Route.useLoaderData()
  const { sessionId } = Route.useParams()

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSessionById(sessionId),
    initialData: initialData,
  })

  const [isChatOpen, setIsChatOpen] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [generatedGoals, setGeneratedGoals] = useState<Goal[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const streamMutation = useMutation({
    mutationKey: ['streamTask', sessionId],
    mutationFn: async ({ task }: { task: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'user', content: task },
      ])

      abortControllerRef.current = new AbortController()

      let buffer = ''
      await streamTask(
        sessionId,
        task,
        (chunk) => {
          buffer += chunk
          const parsedEvents = parseStream(buffer)
          if (parsedEvents.length > 0) {
            const newMessages: Message[] = parsedEvents.map((p) => ({
              id: crypto.randomUUID(),
              type: 'bot',
              parsed: p,
            }))
            setMessages((prev) => [...prev, ...newMessages])
            buffer = ''
          }
        },
        abortControllerRef.current.signal
      )
    },
    onError: (error) => {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user.')
        return
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'bot',
          text: `**Error:** ${error.message}`,
        },
      ])
    },
    onSettled: () => {
      abortControllerRef.current = null
    },
  })

  const reportStreamMutation = useMutation({
    mutationKey: ['streamReportTask', sessionId],
    mutationFn: async ({
      task,
      template,
    }: {
      task: string
      template?: string
    }) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'user', content: task },
      ])

      abortControllerRef.current = new AbortController()

      let buffer = ''
      await streamReportTask(
        sessionId,
        task,
        template,
        (chunk) => {
          buffer += chunk
          const parsedEvents = parseStream(buffer)
          if (parsedEvents.length > 0) {
            const newMessages: Message[] = parsedEvents.map((p) => ({
              id: crypto.randomUUID(),
              type: 'bot',
              parsed: p,
            }))
            setMessages((prev) => [...prev, ...newMessages])
            buffer = ''
          }
        },
        abortControllerRef.current.signal
      )
    },
    onError: (error) => {
      if (error.name === 'AbortError') {
        console.log('Report stream aborted by user.')
        return
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'bot',
          text: `**Error:** ${error.message}`,
        },
      ])
    },
    onSettled: () => {
      abortControllerRef.current = null
    },
  })

  const handleRunTask = async (task: string) => {
    await streamMutation.mutateAsync({ task })
  }
  
  const handleSendReport = (task: string, template?: string) =>
    reportStreamMutation.mutate({ task, template })

  const handleCancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      toast.info('Streaming cancelled.')
    }
  }

  const isTaskStreaming =
    useIsMutating({ mutationKey: ['streamTask', sessionId] }) > 0
  const isReportStreaming =
    useIsMutating({ mutationKey: ['streamReportTask', sessionId] }) > 0
  const isStreaming = isTaskStreaming || isReportStreaming

  const handleToolSelect = (tool: NonNullable<ActiveTool>) =>
    setActiveTool((prev) => (prev === tool ? null : tool))

  const handleDownloadFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to download.')
      return
    }
    toast.info(`Preparing to download: ${selectedFile}`)
    try {
      const res = await fetchFileContent(
        sessionId,
        undefined,
        undefined,
        selectedFile
      )
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedFile
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(
        `Failed to download file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  const sessionName = session?.name || 'Session'

  return (
    <>
      <div className='h-screen w-screen flex flex-col overflow-hidden bg-background'>
        <header className='flex items-center h-14 px-4 shrink-0'>
          <div className='flex items-center gap-4 flex-1'>
            <Link
              to='/dashboard'
              className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
              aria-label='Back to dashboard'
            >
              <ChevronLeft className='h-5 w-5' />
            </Link>
            <div className='font-semibold truncate text-lg'>{sessionName}</div>
          </div>

          <div className='flex justify-center'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setIsChatOpen((prev) => !prev)}
                    aria-label={
                      isChatOpen ? 'Hide Chat Panel' : 'Show Chat Panel'
                    }
                  >
                    {isChatOpen ? (
                      <PanelLeftClose size={20} />
                    ) : (
                      <PanelLeftOpen size={20} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isChatOpen ? 'Hide Chat' : 'Show Chat'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className='flex items-center justify-end gap-2 flex-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setEmailDialogOpen(true)}
              aria-label='Email file'
              disabled={!selectedFile}
            >
              Email
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShareDialogOpen(true)}
              aria-label='Share file'
              disabled={!selectedFile}
            >
              Share
            </Button>
            <Button
              size='sm'
              onClick={handleDownloadFile}
              aria-label='Download file'
              disabled={!selectedFile}
            >
              Download
            </Button>
          </div>
        </header>

        <div className='flex-1 flex overflow-hidden'>
          <ResizablePanelGroup direction='horizontal' className='flex-1'>
            {isChatOpen && (
              <>
                <ResizablePanel
                  defaultSize={30}
                  minSize={0}
                  className='flex flex-col'
                >
                  <ChatPanel
                    messages={messages}
                    onSendMessage={handleRunTask}
                    onSendReportMessage={handleSendReport}
                    isStreaming={isStreaming}
                    onCancelStream={handleCancelStream}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle className='my-4' />
              </>
            )}

            <ResizablePanel
              defaultSize={isChatOpen ? 65 : 100}
              minSize={30}
              className='flex flex-col'
            >
              <FileViewerPanel
                sessionId={sessionId}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
              />
            </ResizablePanel>

            {activeTool && (
              <>
                <ResizableHandle withHandle className='my-3' />
                <ResizablePanel defaultSize={30} minSize={20}>
                  <ToolsPanel
                    sessionId={sessionId}
                    activeTool={activeTool}
                    onClose={() => setActiveTool(null)}
                    onRunTask={handleRunTask}
                    generatedGoals={generatedGoals}
                    onSetGeneratedGoals={setGeneratedGoals}
                    onCancelExecution={handleCancelStream}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>

          <ToolsSidebar
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
          />
        </div>
      </div>

      {selectedFile && (
        <>
          <FileShareDialog
            sessionId={sessionId}
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            fileName={selectedFile}
          />
          <FileEmailDialog
            sessionId={sessionId}
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            fileName={selectedFile}
          />
        </>
      )}
    </>
  )
}
