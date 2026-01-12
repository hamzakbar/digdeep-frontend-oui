import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, User, Check } from "lucide-react"
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchOrgUsers, shareSession, type OrgUser } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ShareSessionDialogProps {
    isOpen: boolean
    onClose: () => void
    sessionId: string | null
    orgId: string | null
}

export function ShareSessionDialog({
    isOpen,
    onClose,
    sessionId,
    orgId,
}: ShareSessionDialogProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    // Get current user to filter out of the list
    const userStr = localStorage.getItem('user_details')
    const currentUser = userStr ? JSON.parse(userStr) : null
    const currentUserId = currentUser?._id

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 400) // 400ms debounce
        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data, isLoading } = useQuery({
        queryKey: ['org-users', orgId, debouncedQuery],
        queryFn: () => orgId ? fetchOrgUsers(orgId, debouncedQuery) : Promise.reject('No Org ID'),
        enabled: isOpen && !!orgId,
    })

    const { mutate: performShare, isPending: isSharing } = useMutation({
        mutationFn: ({ sessionId, targetUserId }: { sessionId: string; targetUserId: string }) =>
            shareSession(sessionId, targetUserId),
        onSuccess: (res) => {
            toast.success(res.message || 'Session shared successfully')
            onClose()
            setSelectedUserId(null)
            setSearchQuery('')
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to share session')
        }
    })

    const users = (data?.users || []).filter(u => u.user_id !== currentUserId)

    const handleShare = () => {
        if (sessionId && selectedUserId) {
            performShare({ sessionId, targetUserId: selectedUserId })
        }
    }

    // Reset selection when search changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedUserId(null)
        }
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] gap-0 p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Share Session</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">
                            Select a user from your organization to share a copy of this session.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Search by email..."
                            className="pl-10 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="size-8 animate-spin text-primary/40" />
                                <p className="text-xs text-muted-foreground font-medium animate-pulse">Fetching teammates...</p>
                            </div>
                        ) : users.length > 0 ? (
                            <div className="grid gap-2">
                                {users.map((user: OrgUser) => (
                                    <button
                                        key={user.user_id}
                                        onClick={() => setSelectedUserId(user.user_id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl transition-all border-2 text-left group",
                                            selectedUserId === user.user_id
                                                ? "bg-primary/5 border-primary/20 shadow-sm"
                                                : "bg-background border-transparent hover:bg-muted/50 hover:border-muted-foreground/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "size-10 rounded-xl flex items-center justify-center transition-colors",
                                                selectedUserId === user.user_id
                                                    ? "bg-primary text-white"
                                                    : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                                            )}>
                                                <User className="size-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold truncate max-w-[200px] leading-none mb-1">
                                                    {user.email.split('@')[0]}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedUserId === user.user_id && (
                                            <div className="size-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in-50 duration-200">
                                                <Check className="size-3.5 text-white stroke-[3]" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                    <User className="size-6 text-muted-foreground/30" />
                                </div>
                                <p className="text-sm font-bold">No users found</p>
                                <p className="text-xs text-muted-foreground mt-1">Try a different email or check the org ID.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border/50">
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            className="rounded-xl flex-1 h-12 font-bold hover:bg-background/80"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl flex-1 px-8 h-12 font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleShare}
                            disabled={!selectedUserId || isSharing}
                        >
                            {isSharing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Sharing...
                                </>
                            ) : (
                                "Share Session"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
