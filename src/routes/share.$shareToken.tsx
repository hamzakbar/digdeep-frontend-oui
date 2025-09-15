import { useState, useRef } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import {
  fetchSharedSessionInfo,
  bootstrapSharedSession,
  streamTask,
} from '@/lib/api'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ChatPanel } from '@/components/chat-panel'
import { FileViewerPanel } from '@/components/file-viewer-panel'
import type { Message } from './_authenticated/sessions/$sessionId'
import { useMutation } from '@tanstack/react-query'

const VISITOR_IDS_KEY = 'shared_session_visitor_ids'

export const Route = createFileRoute('/share/$shareToken')({
  loader: async ({ params: { shareToken } }) => {
    try {
      const sessionInfo = await fetchSharedSessionInfo(shareToken)

      if (new Date(sessionInfo.expires_at) < new Date()) {
        toast.error('This shared link has expired.')
        throw redirect({ to: '/' })
      }

      const getVisitorIds = (): Record<string, string> => {
        const stored = localStorage.getItem(VISITOR_IDS_KEY)
        return stored ? JSON.parse(stored) : {}
      }
      const saveVisitorId = (token: string, id: string) => {
        const ids = getVisitorIds()
        ids[token] = id
        localStorage.setItem(VISITOR_IDS_KEY, JSON.stringify(ids))
      }

      let visitorId = getVisitorIds()[shareToken]
      if (!visitorId) {
        visitorId = uuidv4()
        await bootstrapSharedSession(shareToken, visitorId)
        saveVisitorId(shareToken, visitorId)
      }

      return { sessionInfo, visitorId }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to load shared session.')
      throw redirect({ to: '/' })
    }
  },
  component: SharePageComponent,
})

function SharePageComponent() {
  const { sessionInfo, visitorId } = Route.useLoaderData()
  const { shareToken } = Route.useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const streamMutation = useMutation({
    mutationFn: async ({ task }: { task: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'user', content: task },
      ])
      const botMessageId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        { id: botMessageId, type: 'bot', text: '' },
      ])

      abortControllerRef.current = new AbortController()

      await streamTask(
        shareToken,
        task,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId && m.type === 'bot'
                ? { ...m, text: (m.text ?? '') + chunk }
                : m
            )
          )
        },

        abortControllerRef.current.signal,
        true,
        visitorId
      )
    },
    onError: (error) => {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted by user.')
        return
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'bot',
          text: `Error: ${error.message}`,
        },
      ])
    },
    onSettled: () => {
      abortControllerRef.current = null
    },
  })

  const handleRunTask = (task: string) => {
    streamMutation.mutate({ task })
  }

  const handleCancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      toast.info('Streaming cancelled.')
    }
  }

  return (
    <div className='h-screen w-screen flex flex-col overflow-hidden bg-background'>
      <header className='flex items-center h-14 px-4 border-b shrink-0'>
        <span className='font-semibold'>DigDeep Session</span>
        {sessionInfo.label && (
          <span className='ml-4 text-sm text-muted-foreground'>
            {sessionInfo.label}
          </span>
        )}
      </header>

      <div className='flex-1 flex overflow-hidden'>
        <ResizablePanelGroup direction='horizontal' className='flex-1'>
          <ResizablePanel defaultSize={40} minSize={25}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleRunTask}
              isStreaming={streamMutation.isPending}
              onSendReportMessage={() => {
                toast.info('Report generation is not available in this view.')
              }}
              onCancelStream={handleCancelStream}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            <FileViewerPanel
              shareToken={shareToken}
              visitorId={visitorId}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
