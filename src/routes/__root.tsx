import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
})

const RootLayout = () => (
    <QueryClientProvider client={queryClient}>
        <Outlet />
        <TanStackRouterDevtools />
    </QueryClientProvider>
)

export const Route = createRootRoute({
    component: RootLayout,
})