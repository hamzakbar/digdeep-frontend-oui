import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFiles } from '@/lib/api'
import {
    Search,
    Download,
    Loader2,
    HardDrive,
    X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getIconForFile } from '@/lib/file-utils'
import { FilePreview } from '@/components/file-preview'
import { cn } from '@/lib/utils'
import { useStreaming } from '@/contexts/streaming-context'

export const Route = createFileRoute('/session/$sessionId/files')({
    component: FilesPage,
})

function FilesPage() {
    const { sessionId } = Route.useParams()
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const { isStreaming } = useStreaming()

    const { data: files, isLoading, error } = useQuery({
        queryKey: ['session-files', sessionId],
        queryFn: () => fetchFiles(sessionId),
        refetchInterval: isStreaming ? 1000 : false,
    })

    const handleDownload = async (fileName: string) => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/session/${sessionId}/outputs/${encodeURIComponent(fileName)}`
            const response = await fetch(url, {
                headers: { 'Accept': '*/*' },
                credentials: 'include'
            })

            if (!response.ok) throw new Error('Download failed')

            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error('Failed to download file:', error)
        }
    }

    const filteredFiles = files?.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="size-10 text-primary/40 animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Fetching files...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <Card className="p-12 text-center border-destructive/20 bg-destructive/5 rounded-[2.5rem] shadow-xl shadow-destructive/5 max-w-md">
                    <p className="text-destructive font-black text-lg">Failed to load files</p>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">There was a problem reaching the server. Please check your connection.</p>
                    <Button variant="outline" className="mt-6 rounded-xl" onClick={() => window.location.reload()}>Retry Connection</Button>
                </Card>
            </div>
        )
    }

    if (!files || files.length === 0) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <div className="text-center py-20 px-10 glass rounded-[3rem] border-dashed border-primary/20 bg-primary/[0.02] flex flex-col items-center max-w-lg">
                    <div className="size-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 shadow-inner">
                        <HardDrive className="size-10 text-primary opacity-40" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 opacity-80">No files found</h2>
                    <p className="text-muted-foreground font-medium opacity-60 text-center">
                        This session doesn't have any generated files or data assets yet. Start a task to generate outputs.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            {!selectedFile && (
                <div className="p-8 pb-0 pl-14 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Session Files</h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and view all files generated in this session.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 h-10 w-64 rounded-xl border bg-muted/20 focus:outline-none focus:ring-4 focus:ring-primary/5 text-sm transition-all shadow-sm border-border/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-8 flex gap-6 min-w-0">
                {/* Left Sidebar (Visible only when a file is selected) */}
                {selectedFile && (
                    <div className="w-80 flex flex-col gap-4 animate-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                <HardDrive className="size-3.5" />
                                Files ({files.length})
                            </h2>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setSelectedFile(null)}>
                                <X className="size-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {files.map((file) => {
                                const { Icon, color, bgColor } = getIconForFile(file.name)
                                const isSelected = selectedFile === file.name
                                return (
                                    <button
                                        key={file.name}
                                        onClick={() => setSelectedFile(file.name)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group",
                                            isSelected
                                                ? "bg-primary/10 border-primary/50 shadow-sm text-primary"
                                                : "bg-card/40 border-border/40 hover:border-primary/30 hover:bg-card/60"
                                        )}
                                    >
                                        <div className={cn(
                                            "size-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-inner",
                                            isSelected ? "bg-primary/20 scale-105" : bgColor
                                        )}>
                                            <Icon className={cn("size-5", isSelected ? "text-primary" : color)} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("text-xs font-bold truncate transition-colors", isSelected ? "text-primary" : "text-foreground/80")}>
                                                {file.name}
                                            </p>
                                            <p className={cn("text-[10px] font-medium opacity-60 transition-colors", isSelected ? "text-primary/60" : "text-muted-foreground")}>
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto flex flex-col min-w-0 custom-scrollbar">
                    {!selectedFile ? (
                        <div className="space-y-4 animate-in fade-in duration-700">
                            <div className="flex items-center gap-3 px-1">
                                <div className="p-1.5 bg-primary/5 rounded-lg">
                                    <HardDrive className="size-4 text-primary" />
                                </div>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Files ({filteredFiles.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {filteredFiles.map((file) => {
                                    const { Icon, color, bgColor } = getIconForFile(file.name)
                                    return (
                                        <Card
                                            key={file.name}
                                            className="p-4 rounded-2xl hover:border-primary/40 transition-all group bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 border-border/40 cursor-pointer flex flex-col justify-between h-[150px]"
                                            onClick={() => setSelectedFile(file.name)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={cn("size-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner", bgColor)}>
                                                    <Icon className={cn("size-5", color)} />
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="rounded-full h-8 px-4 bg-black text-white hover:bg-black/80 text-[10px] font-bold transition-all shadow-lg active:scale-95"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(file.name);
                                                    }}
                                                >
                                                    <Download className="size-3.5 mr-1.5" />
                                                    Download
                                                </Button>
                                            </div>

                                            <div className="space-y-1 mb-auto">
                                                <h3 className="font-bold text-[13px] leading-snug line-clamp-2 text-foreground/80" title={file.name}>{file.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-tighter rounded-md bg-muted/60 text-muted-foreground border-0">
                                                        {file.fmt}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground font-semibold opacity-70">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                            {filteredFiles.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Search className="size-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <h3 className="text-lg font-bold text-muted-foreground">No matches found</h3>
                                    <p className="text-sm text-muted-foreground/60">Try adjusting your search query.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Card className="flex-1 min-w-0 rounded-[2.5rem] border-border/40 overflow-hidden shadow-2xl shadow-primary/5 bg-background animate-in zoom-in-95 duration-500">
                            <FilePreview
                                sessionId={sessionId}
                                selectedFile={selectedFile}
                                onClose={() => setSelectedFile(null)}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
