import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchSessions } from '@/lib/api'
import { auth } from '@/lib/auth'
import {
  LayoutDashboard, Clock,
  MoreVertical,
  ChevronRight,
  Database,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions(),
  })

  // Get user details for avatar
  const userStr = localStorage.getItem('user_details')
  const user = userStr ? JSON.parse(userStr) : null
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || '?' : '?'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="relative w-8 h-8 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Database className="text-primary-foreground size-4" />
              <Sparkles className="absolute -top-1 -right-1 size-3 text-accent animate-pulse" />
            </div>
            <span className="font-bold tracking-tight">DigDeep</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button size="sm" className="rounded-xl px-4">
              New Session
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <div
                className="size-10 rounded-full bg-gradient-to-tr from-primary via-primary/90 to-accent/30 border-2 border-white shadow-xl flex items-center justify-center font-bold text-white text-xs"
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
            <Button size="lg" className="rounded-2xl px-8 shadow-lg shadow-primary/20">
              Create First Session
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((session) => (
              <Card key={session.session_id} className="group hover:border-primary/30 transition-all duration-300 rounded-3xl p-6 relative overflow-hidden flex flex-col h-full bg-white shadow-sm border-border/50">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="size-10 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Clock className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>

                <div className="flex-1 relative z-10">
                  <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1">{session.name || 'Untitled Session'}</h3>
                  <p className="text-xs text-muted-foreground mb-4">ID: {session.session_id.substring(0, 8)}...</p>

                  {session.data_context && (
                    <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-3 rounded-xl min-h-[50px] italic">
                      "{session.data_context}"
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between relative z-10 pt-4 border-t border-border/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Now
                  </span>
                  <Button variant="ghost" className="h-8 px-3 rounded-xl text-xs font-semibold group-hover:text-primary">
                    Open Session
                    <ChevronRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
