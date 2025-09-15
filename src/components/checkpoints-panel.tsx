import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCheckpoints,
  activateCheckpoint,
  deactivateCheckpoint,
  deleteCheckpoint,
  createCheckpoint,
} from '@/lib/api'
import { Button } from './ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Skeleton } from './ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2, Plus, Trash2, Play, StopCircle } from 'lucide-react'
import { Input } from './ui/input'

interface Checkpoint {
  checkpoint_id: string
  label: string
  created_at: string
  is_active: boolean
}

export function CheckpointsPanel({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient()
  const [newCheckpointLabel, setNewCheckpointLabel] = useState('')
  const [forceActive, setForceActive] = useState<{
    id: string | null
    until: number
  } | null>(null)

  const setActiveInCache = (session: string, checkpointId: string | null) => {
    queryClient.setQueryData(['checkpoints', session], (old: any) => {
      if (!old?.data) return old
      return {
        ...old,
        data: old.data.map((cp: Checkpoint) => ({
          ...cp,
          is_active: checkpointId ? cp.checkpoint_id === checkpointId : false,
        })),
      }
    })
  }

  const checkpointsQuery = useQuery({
    queryKey: ['checkpoints', sessionId],
    queryFn: () => fetchCheckpoints(sessionId),
    staleTime: 5000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const safeInvalidate = (key: unknown[]) => {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: key })
    }, 800)
  }

  const createMutation = useMutation({
    mutationFn: createCheckpoint as (args: {
      sessionId: string
      label: string
    }) => Promise<any>,
    onSuccess: () => {
      toast.success('Checkpoint created!')
      setNewCheckpointLabel('')
      safeInvalidate(['checkpoints', sessionId])
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const activateMutation = useMutation({
    mutationFn: activateCheckpoint as (args: {
      sessionId: string
      checkpointId: string
    }) => Promise<any>,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({
        queryKey: ['checkpoints', vars.sessionId],
      })
      const previous = queryClient.getQueryData(['checkpoints', vars.sessionId])
      setActiveInCache(vars.sessionId, vars.checkpointId)
      setForceActive({ id: vars.checkpointId, until: Date.now() + 3000 })
      return { previous, vars }
    },
    onError: (error: Error, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(
          ['checkpoints', ctx.vars.sessionId],
          ctx.previous
        )
      setForceActive(null)
      toast.error(error.message)
    },
    onSuccess: (_data, vars) => {
      setActiveInCache(vars.sessionId, vars.checkpointId)
      setForceActive({ id: vars.checkpointId, until: Date.now() + 1500 })
      toast.success('Checkpoint activated!')
      safeInvalidate(['checkpoints', vars.sessionId])
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateCheckpoint as (sessionId: string) => Promise<any>,
    onMutate: async (sessionIdVar) => {
      await queryClient.cancelQueries({
        queryKey: ['checkpoints', sessionIdVar],
      })
      const previous = queryClient.getQueryData(['checkpoints', sessionIdVar])
      setActiveInCache(sessionIdVar, null)
      setForceActive({ id: null, until: Date.now() + 3000 })
      return { previous, sessionIdVar }
    },
    onError: (error: Error, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(
          ['checkpoints', ctx.sessionIdVar],
          ctx.previous
        )
      setForceActive(null)
      toast.error(error.message)
    },
    onSuccess: (_data, sessionIdVar) => {
      setActiveInCache(sessionIdVar, null)
      setForceActive({ id: null, until: Date.now() + 1500 })
      toast.success('Checkpoint deactivated!')
      safeInvalidate(['checkpoints', sessionIdVar])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCheckpoint as (checkpointId: string) => Promise<any>,
    onMutate: async (checkpointId) => {
      await queryClient.cancelQueries({ queryKey: ['checkpoints', sessionId] })
      const previous = queryClient.getQueryData(['checkpoints', sessionId])
      queryClient.setQueryData(['checkpoints', sessionId], (old: any) => {
        if (!old?.data) return old
        const wasActive = old.data.some(
          (c: Checkpoint) => c.checkpoint_id === checkpointId && c.is_active
        )
        const next = {
          ...old,
          data: old.data.filter(
            (cp: Checkpoint) => cp.checkpoint_id !== checkpointId
          ),
        }
        if (wasActive) {
          next.data = next.data.map((cp: Checkpoint) => ({
            ...cp,
            is_active: false,
          }))
          setForceActive({ id: null, until: Date.now() + 1500 })
        }
        return next
      })
      return { previous }
    },
    onError: (error: Error, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['checkpoints', sessionId], ctx.previous)
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Checkpoint deleted!')
      safeInvalidate(['checkpoints', sessionId])
    },
  })

  const handleCreate = () => {
    if (!newCheckpointLabel.trim()) return
    createMutation.mutate({ sessionId, label: newCheckpointLabel.trim() })
  }

  if (checkpointsQuery.isPending) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    )
  }

  if (checkpointsQuery.isError) {
    return (
      <p className='text-destructive'>
        {(checkpointsQuery.error as Error).message}
      </p>
    )
  }

  const checkpoints: Checkpoint[] = checkpointsQuery.data?.data ?? []
  const serverActiveId =
    checkpoints.find((c) => c.is_active)?.checkpoint_id ?? null
  const effectiveActiveId =
    forceActive && forceActive.until > Date.now()
      ? forceActive.id
      : serverActiveId

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <Input
          placeholder='New checkpoint label...'
          value={newCheckpointLabel}
          onChange={(e) => setNewCheckpointLabel(e.target.value)}
          disabled={createMutation.isPending}
        />
        <Button
          onClick={handleCreate}
          disabled={createMutation.isPending || !newCheckpointLabel.trim()}
          aria-label='Create checkpoint'
        >
          {createMutation.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Plus className='h-4 w-4' />
          )}
        </Button>
      </div>

      {checkpoints.length === 0 ? (
        <p className='text-muted-foreground text-sm text-center'>
          No checkpoints created yet.
        </p>
      ) : (
        checkpoints.map((cp) => {
          const isActive = cp.checkpoint_id === effectiveActiveId
          const isActivatingThis =
            activateMutation.isPending &&
            (activateMutation.variables as any)?.checkpointId ===
              cp.checkpoint_id
          const isDeactivatingThis =
            deactivateMutation.isPending &&
            (deactivateMutation.variables as any) === sessionId
          const isDeletingThis =
            deleteMutation.isPending &&
            (deleteMutation.variables as any) === cp.checkpoint_id

          return (
            <Card
              key={cp.checkpoint_id}
              className={isActive ? 'border-primary' : ''}
            >
              <CardHeader>
                <CardTitle className='text-base'>{cp.label}</CardTitle>
                <CardDescription>
                  {format(new Date(cp.created_at), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardFooter className='flex justify-between'>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={
                    activateMutation.isPending || deactivateMutation.isPending
                  }
                  onClick={() => {
                    if (isActive) {
                      deactivateMutation.mutate(sessionId)
                    } else {
                      activateMutation.mutate({
                        sessionId,
                        checkpointId: cp.checkpoint_id,
                      })
                    }
                  }}
                >
                  {isActive ? (
                    <>
                      {isDeactivatingThis ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <StopCircle className='mr-2 h-4 w-4' />
                      )}
                      Deactivate
                    </>
                  ) : (
                    <>
                      {isActivatingThis ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Play className='mr-2 h-4 w-4' />
                      )}
                      Activate
                    </>
                  )}
                </Button>

                <Button
                  size='icon'
                  variant='ghost'
                  className='text-destructive hover:text-destructive-foreground hover:bg-destructive'
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(cp.checkpoint_id)}
                  aria-label='Delete checkpoint'
                >
                  {isDeletingThis ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })
      )}
    </div>
  )
}
