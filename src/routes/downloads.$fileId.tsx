import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFileContent } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFound } from '@/components/not-found'

export const Route = createFileRoute('/downloads/$fileId')({
  component: DownloadFileComponent,
})

function DownloadFileComponent() {
  const { fileId } = Route.useParams()

  const fileQuery = useQuery({
    queryKey: ['download', fileId],
    queryFn: async () => {
      // Passing undefined for sessionId, shareToken, and visitorId as they're not needed for this route
      const response = await fetchFileContent(undefined, undefined, undefined, fileId)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const contentDisposition = response.headers.get('content-disposition')
      let fileName = 'download'
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (fileNameMatch && fileNameMatch.length > 1) {
          fileName = fileNameMatch[1]
        }
      }
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return { success: true, fileName }
    },
    retry: false,
  })

  if (fileQuery.isPending) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-80' />
      </div>
    )
  }

  if (fileQuery.isError) {
    return <NotFound resource='file' />
  }

  return (
    <div className='flex h-screen flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-bold'>Download Started</h1>
      <p className='text-muted-foreground'>
        Your download for "{fileQuery.data.fileName}" has started.
      </p>
    </div>
  )
}