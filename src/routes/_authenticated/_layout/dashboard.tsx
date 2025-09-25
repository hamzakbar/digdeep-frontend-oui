import { createFileRoute } from '@tanstack/react-router'
import { ModeToggle } from '@/components/mode-toggle'
import { UserNav } from '@/components/user-nav'
import { CreateSessionDialog } from '@/components/create-session-dialog'
import { AlertCircle } from 'lucide-react'

/*
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchSessions, type Session } from '@/lib/api'
import { SessionCard, SessionCardSkeleton } from '@/components/session-card'
import { DuplicateSessionDialog } from '@/components/duplicate-session-dialog'
import { DeleteSessionDialog } from '@/components/delete-session-dialog'
import { SessionShareDialog } from '@/components/session-share-dialog'
import { PublicShareDialog } from '@/components/public-share-dialog'
import { Button } from '@/components/ui/button'
import { FilePlus, Loader2 } from 'lucide-react'
*/

export const Route = createFileRoute('/_authenticated/_layout/dashboard')({
  pendingComponent: DashboardSkeleton,
  loader: async ({ context }) => {
    // Ensure user data is available when loading dashboard
    await context.auth.getUser();
  },
  component: DashboardComponent,
})

function DashboardSkeleton() {
  return (
    <div className='container mx-auto p-4 md:p-8 animate-pulse'>
      <header className='flex items-center justify-between mb-8'>
        <div className='h-8 w-32 bg-muted rounded-md' />
        <div className='flex items-center gap-4'>
          <div className='h-10 w-36 bg-muted rounded-md' />
          <div className='h-10 w-10 bg-muted rounded-md' />
          <div className='h-8 w-8 bg-muted rounded-full' />
        </div>
      </header>
      <main>
        <div className='h-7 w-48 bg-muted rounded-md mb-6' />
        <div className='h-32 w-full bg-muted rounded-md' />
      </main>
    </div>
  )
}

function DashboardComponent() {
  return (
    <>
      <div className='container mx-auto p-4 md:p-8'>
        <header className='flex items-center justify-between mb-8'>
          <h1 className='text-2xl font-bold'>DigDeep</h1>
          <div className='flex items-center gap-4'>
            <CreateSessionDialog />
            <ModeToggle />
            <UserNav />
          </div>
        </header>

        <main>
          <h2 className='text-xl font-semibold mb-6'>Your Sessions</h2>
          <div className='flex flex-col items-center justify-center text-center py-12 bg-muted/50 border border-dashed rounded-lg'>
            <AlertCircle className='h-10 w-10 mb-4 text-muted-foreground' />
            <p className='text-lg font-semibold'>Session list coming soon</p>
            <p className='text-sm text-muted-foreground'>
              You can still create a new session using the button above.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}

/*
function DashboardComponent() {
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [sessionToDuplicate, setSessionToDuplicate] = useState<Session | null>(
    null
  )
  const [sessionToShare, setSessionToShare] = useState<Session | null>(null)
  const [sessionToPublicShare, setSessionToPublicShare] =
    useState<Session | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.has_more) {
        return (lastPage.page || 1) + 1
      }
      return undefined
    },
  })

  const sessions = data?.pages.flatMap((page) => page.data) ?? []
  const showSkeleton = isPending && sessions.length === 0

  return (
    <>
      <div className='container mx-auto p-4 md:p-8'>
        <header className='flex items-center justify-between mb-8'>
          <h1 className='text-2xl font-bold'>DigDeep</h1>
          <div className='flex items-center gap-4'>
            <CreateSessionDialog />
            <ModeToggle />
            <UserNav />
          </div>
        </header>

        <main>
          <h2 className='text-xl font-semibold mb-6'>Your Sessions</h2>

          {showSkeleton ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {Array.from({ length: 8 }).map((_, i) => (
                <SessionCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center justify-center text-center py-12 text-destructive bg-destructive/5 border border-destructive/20 rounded-lg'>
              <AlertCircle className='h-10 w-10 mb-4' />
              <p className='text-lg font-semibold'>Error Loading Sessions</p>
              <p className='text-sm'>{error.message}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className='flex flex-col items-center justify-center text-center py-12 bg-muted/50 border border-dashed rounded-lg'>
              <FilePlus className='h-10 w-10 mb-4 text-muted-foreground' />
              <p className='text-lg font-semibold'>No Sessions Found</p>
              <p className='text-sm text-muted-foreground'>
                Get started by creating your first session.
              </p>
              <div className='mt-4'>
                <CreateSessionDialog />
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl-grid-cols-4 gap-6'>
              {sessions.map((session) => (
                <Link
                  key={session.session_id}
                  to='/sessions/$sessionId'
                  params={{ sessionId: session.session_id }}
                  className='focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg'
                >
                  <SessionCard
                    session={session}
                    onInitiateDelete={setSessionToDelete}
                    onInitiateDuplicate={setSessionToDuplicate}
                    onInitiateShare={setSessionToShare}
                    onInitiatePublicShare={setSessionToPublicShare}
                  />
                </Link>
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className='mt-8 text-center'>
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant='outline'
              >
                {isFetchingNextPage ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : null}
                {isFetchingNextPage ? 'Loading...' : 'Load More Sessions'}
              </Button>
            </div>
          )}
        </main>
      </div>

      {sessionToDelete && (
        <DeleteSessionDialog
          open={!!sessionToDelete}
          onOpenChange={() => setSessionToDelete(null)}
          sessionId={sessionToDelete.session_id}
          sessionName={sessionToDelete.name}
        />
      )}

      {sessionToDuplicate && (
        <DuplicateSessionDialog
          sessionId={sessionToDuplicate.session_id}
          sessionName={sessionToDuplicate.name}
          open={!!sessionToDuplicate}
          onOpenChange={() => setSessionToDuplicate(null)}
        />
      )}

      {sessionToShare && (
        <SessionShareDialog
          sessionId={sessionToShare.session_id}
          open={!!sessionToShare}
          onOpenChange={() => setSessionToShare(null)}
        />
      )}

      {sessionToPublicShare && (
        <PublicShareDialog
          sessionId={sessionToPublicShare.session_id}
          open={!!sessionToPublicShare}
          onOpenChange={() => setSessionToPublicShare(null)}
        />
      )}
    </>
  )
}
*/
