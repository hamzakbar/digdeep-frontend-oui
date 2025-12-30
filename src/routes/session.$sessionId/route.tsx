import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/session/$sessionId')({
    beforeLoad: async () => {
        const isAuthenticated = await auth.isAuthenticated()
        if (!isAuthenticated) {
            throw redirect({
                to: '/',
            })
        }
    },
    component: SessionLayout,
})

function SessionLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Outlet />
        </div>
    )
}
