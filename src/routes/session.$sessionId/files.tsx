import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFiles } from '@/lib/api'
import {
    Search,
    Filter,
    Download,
    MoreVertical,
    ExternalLink,
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

export const Route = createFileRoute('/session/$sessionId/files')({
    component: FilesPage,
})

function FilesPage() {
    const { sessionId } = Route.useParams()
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const { data: files, isLoading, error } = useQuery({
        queryKey: ['session-files', sessionId],
        queryFn: () => fetchFiles(sessionId),
    })

    const handleDownload = async (fileName: string) => {
        // Implement download logic if needed here, although FilePreview has it too
        console.log('Downloading', fileName)
    }

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
                <div className="p-8 pb-0 animate-in fade-in slide-in-from-top-2 duration-500">
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
                                    className="pl-9 pr-4 h-10 w-64 rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 text-sm transition-all shadow-sm"
                                />
                            </div>
                            <Button variant="outline" className="rounded-xl px-4 bg-white shadow-sm border-border/60">
                                <Filter className="size-4 mr-2" />
                                Filter
                            </Button>
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
                                                ? "bg-primary border-primary shadow-lg shadow-primary/20 text-white"
                                                : "bg-white border-border/50 hover:border-primary/40 hover:shadow-md"
                                        )}
                                    >
                                        <div className={cn(
                                            "size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                            isSelected ? "bg-white/20" : bgColor
                                        )}>
                                            <Icon className={cn("size-5", isSelected ? "text-white" : color)} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-foreground/80")}>
                                                {file.name}
                                            </p>
                                            <p className={cn("text-[10px] font-medium opacity-60", isSelected ? "text-white/80" : "text-muted-foreground")}>
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
                <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                    {!selectedFile ? (
                        <div className="space-y-6 animate-in fade-in duration-700">
                            <div className="flex items-center gap-3 px-1">
                                <div className="p-1.5 bg-primary/5 rounded-lg">
                                    <HardDrive className="size-4 text-primary" />
                                </div>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Files ({files.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
                                {files.map((file) => {
                                    const { Icon, color, bgColor } = getIconForFile(file.name)
                                    return (
                                        <Card
                                            key={file.name}
                                            className="p-5 rounded-3xl hover:border-primary/40 transition-all group bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 border-border/50 cursor-pointer"
                                            onClick={() => setSelectedFile(file.name)}
                                        >
                                            <div className="flex items-start justify-between mb-5">
                                                <div className={cn("size-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner", bgColor)}>
                                                    <Icon className={cn("size-6", color)} />
                                                </div>
                                                <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-muted transition-colors" onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Handle more options
                                                }}>
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <h3 className="font-bold text-sm truncate pr-4 text-foreground/80" title={file.name}>{file.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 font-bold uppercase tracking-tighter rounded-lg bg-muted/60 text-muted-foreground border-0">
                                                        {file.fmt}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground font-semibold opacity-70">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 rounded-2xl text-[11px] font-bold h-9 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 border-border/60"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(file.name);
                                                    }}
                                                >
                                                    <Download className="size-3.5 mr-2 transition-transform group-hover:-translate-y-0.5" />
                                                    Download
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-9 rounded-2xl border-border/60 hover:bg-primary/5 hover:border-primary/20 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFile(file.name);
                                                    }}
                                                >
                                                    <ExternalLink className="size-3.5 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <Card className="flex-1 min-w-0 rounded-[2.5rem] border-border/40 overflow-hidden shadow-2xl shadow-primary/5 bg-white animate-in zoom-in-95 duration-500">
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

