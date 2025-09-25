import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { auth } from '@/lib/auth'

const queryClient = new QueryClient()

interface MyRouterContext {
  auth: typeof auth
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
        <div className='min-h-screen bg-background font-sans antialiased'>
          <Outlet />
        </div>

        <Toaster richColors />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
