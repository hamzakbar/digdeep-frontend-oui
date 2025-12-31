import { createFileRoute, redirect, Outlet, Link, useLocation } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
    SidebarRail,
} from '@/components/ui/sidebar'
import {
    MessageSquare,
    FileText,
    ArrowLeft,
    Settings,
    Database,
    Sparkles,
    ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    const { sessionId } = Route.useParams()
    const location = useLocation()

    // Get user details for profile
    const userStr = localStorage.getItem('user_details')
    const user = userStr ? JSON.parse(userStr) : null
    const userName = user ? `${user.firstName} ${user.lastName}` : 'User'
    const userEmail = user?.email || 'user@example.com'
    const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U'

    const navItems = [
        {
            label: 'Agent',
            icon: MessageSquare,
            to: '/session/$sessionId/chat',
        },
        {
            label: 'Files',
            icon: FileText,
            to: '/session/$sessionId/files',
        },
        {
            label: 'Planner',
            icon: ClipboardList,
            to: '/session/$sessionId/planner',
        },
    ]

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
                <Sidebar collapsible="icon" className="border-r bg-white/50 backdrop-blur-xl">
                    <SidebarHeader className="p-4 pt-6">
                        <Link to="/" className="flex items-center gap-3 group px-2">
                            <div className="relative w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-xl shadow-primary/20">
                                <Database className="text-primary-foreground size-5" />
                                <Sparkles className="absolute -top-1 -right-1 size-3.5 text-accent animate-pulse" />
                            </div>
                            <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
                                <span className="font-bold tracking-tight text-lg leading-tight">DigDeep</span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-tight">Platform</span>
                            </div>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-2">
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 group-data-[collapsible=icon]:hidden">
                                Platform
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navItems.map((item) => (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={location.pathname.includes(item.to.replace('$sessionId', sessionId))}
                                                tooltip={item.label}
                                                className="rounded-xl h-11 px-4 transition-all hover:bg-muted group"
                                            >
                                                <Link to={item.to} params={{ sessionId }}>
                                                    <item.icon className={cn(
                                                        "size-5 shrink-0 transition-colors",
                                                        location.pathname.includes(item.to.replace('$sessionId', sessionId))
                                                            ? "text-primary fill-primary/10"
                                                            : "text-muted-foreground group-hover/menu-button:text-foreground"
                                                    )} />
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="p-4 space-y-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all group overflow-hidden"
                        >
                            <ArrowLeft className="size-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
                            <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap">Back to Dashboard</span>
                        </Link>

                        <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0 transition-all">
                            <div className="flex items-center gap-3 px-1">
                                <div className="size-9 shrink-0 rounded-full bg-gradient-to-tr from-primary to-primary/80 border-2 border-white shadow-xl flex items-center justify-center text-[11px] font-bold text-white">
                                    {initials}
                                </div>
                                <div className="flex flex-col flex-1 group-data-[collapsible=icon]:hidden overflow-hidden">
                                    <p className="text-xs font-bold truncate leading-tight">{userName}</p>
                                    <p className="text-[10px] text-muted-foreground truncate leading-tight">{userEmail}</p>
                                </div>
                                <Settings className="size-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors group-data-[collapsible=icon]:hidden shrink-0" />
                            </div>
                        </div>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                <SidebarInset className="flex-1 flex flex-col bg-slate-50/50">
                    <Outlet />
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
