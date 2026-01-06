import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSessions, startSession } from '@/lib/api'
import { auth } from '@/lib/auth'
import {
  LayoutDashboard, Clock,
  ChevronRight,
  Database,
  Sparkles,
  Loader2,
  Zap,
  Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react'
import { ModeToggle } from '@/components/mode-toggle'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const isAuthenticated = await auth.isAuthenticated()
    if (!isAuthenticated) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions(),
  })

  const { mutate: createSession, isPending: isCreating } = useMutation({
    mutationFn: startSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate({
        to: '/session/$sessionId',
        params: { sessionId: newSession.session_id }
      })
    },
  })

  // Get user details for avatar
  const userStr = localStorage.getItem('user_details')
  const user = userStr ? JSON.parse(userStr) : null
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || '?' : '?'

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [mode, setMode] = useState<'fast' | 'slow'>('fast')

  const handleCreateSession = () => {
    if (!sessionName.trim()) return
    createSession({ name: sessionName, mode })
    setIsDialogOpen(false)
    setSessionName('')
    setMode('fast')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="relative w-8 h-8 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Database className="text-primary-foreground size-4" />
              <Sparkles className="absolute -top-1 -right-1 size-3 text-accent animate-pulse" />
            </div>
            <span className="font-bold tracking-tight">DigDeep</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Button
                size="sm"
                className="rounded-xl px-4"
                onClick={() => setIsDialogOpen(true)}
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : 'New Session'}
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <div
                className="size-9 rounded-full bg-gradient-to-tr from-primary to-primary/80 border-2 border-border shadow-xl flex items-center justify-center text-[11px] font-bold text-white"
              >
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Welcome back. Here are your recent analysis sessions.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-lg py-1 px-3 border-primary/10 bg-primary/5 text-primary">
              {data?.total_count || 0} Total Sessions
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-muted/30 border-dashed rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 glass rounded-[2rem] border-destructive/20 bg-destructive/5">
            <p className="text-destructive font-semibold">Failed to load sessions</p>
            <p className="text-muted-foreground text-sm mt-2">Please try refreshing the page or check your connection.</p>
            <Button variant="outline" size="sm" className="mt-6 rounded-xl" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <div className="text-center py-24 glass rounded-[3rem] border-dashed border-primary/20 bg-primary/[0.02]">
            <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="size-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No sessions yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              Start your first deep analysis by clicking the button below.
            </p>
            <Button
              size="lg"
              className="rounded-2xl px-8 shadow-lg shadow-primary/20"
              onClick={() => setIsDialogOpen(true)}
              disabled={isCreating}
            >
              {isCreating ? <Loader2 className="size-5 animate-spin mr-2" /> : null}
              Create First Session
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((session) => (
              <Card
                key={session.session_id}
                className="group hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-center cursor-pointer border-border/50"
                onClick={() => navigate({ to: '/session/$sessionId', params: { sessionId: session.session_id } })}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Clock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold tracking-tight text-base line-clamp-1">{session.name || 'Untitled Session'}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {session.session_id.substring(0, 8)}</p>
                    </div>
                  </div>

                  {/* <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                    <MoreVertical className="size-4" />
                  </Button> */}
                </div>

                {session.data_context && (
                  <div className="text-xs text-muted-foreground line-clamp-1 bg-muted/30 px-2 py-1 rounded-md italic mb-3">
                    "{session.data_context}"
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-auto">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Now
                  </span>
                  <div className="text-primary text-xs font-semibold flex items-center">
                    Open
                    <ChevronRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Create Session</DialogTitle>
            <DialogDescription>
              Give your new analysis session a descriptive name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-semibold ml-1">
                Session Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Q4 Financial Review"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid gap-2 mt-2">
              <Label className="text-sm font-semibold ml-1">
                Analysis Mode
              </Label>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as 'fast' | 'slow')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl p-1 bg-muted/50 border border-border/50">
                  <TabsTrigger
                    value="fast"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
                  >
                    <Zap className="size-3.5" />
                    <span>Fast</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="slow"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
                  >
                    <Timer className="size-3.5" />
                    <span>Slow</span>
                  </TabsTrigger>
                </TabsList>
                <p className="text-[10px] text-muted-foreground mt-2 ml-1 px-1">
                  {mode === 'fast'
                    ? 'Optimized for speed and quick insights.'
                    : 'Deep analysis mode. More thorough but takes longer.'}
                </p>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              className="rounded-xl px-6"
              disabled={!sessionName.trim() || isCreating}
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
