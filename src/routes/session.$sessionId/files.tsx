import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFiles } from '@/lib/api'
import {
    FileText,
    Search,
    Filter,
    Download,
    MoreVertical,
    ExternalLink,
    Loader2,
    HardDrive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/session/$sessionId/files')({
    component: FilesPage,
})

function FilesPage() {
    const { sessionId } = Route.useParams()
    const { data: files, isLoading, error } = useQuery({
        queryKey: ['session-files', sessionId],
        queryFn: () => fetchFiles(sessionId),
    })

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Session Files</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and view all data assets generated in this session.</p>
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

            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="size-10 text-primary/40 animate-spin" />
                        <p className="text-muted-foreground font-medium animate-pulse">Fetching session assets...</p>
                    </div>
                ) : error ? (
                    <Card className="p-12 text-center border-destructive/20 bg-destructive/5 rounded-[2.5rem] shadow-xl shadow-destructive/5">
                        <p className="text-destructive font-black text-lg">Failed to load files</p>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">There was a problem reaching the server. Please check your connection.</p>
                        <Button variant="outline" className="mt-6 rounded-xl" onClick={() => window.location.reload()}>Retry Connection</Button>
                    </Card>
                ) : !files || files.length === 0 ? (
                    <div className="text-center py-32 glass rounded-[3rem] border-dashed border-primary/20 bg-primary/[0.02] flex flex-col items-center">
                        <div className="size-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 shadow-inner">
                            <FileText className="size-10 text-primary opacity-40" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 opacity-80">No files found</h2>
                        <p className="text-muted-foreground max-w-xs mx-auto font-medium opacity-60">
                            This session doesn't have any generated files or data assets yet. Start a task to generate outputs.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <div className="p-1.5 bg-primary/5 rounded-lg">
                                <HardDrive className="size-4 text-primary" />
                            </div>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Output Assets ({files.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {files.map((file) => (
                                <Card key={file.name} className="p-5 rounded-3xl hover:border-primary/40 transition-all group bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 border-border/50">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                                            <FileText className="size-6 text-primary" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-muted transition-colors">
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
                                        <Button variant="outline" size="sm" className="flex-1 rounded-2xl text-[11px] font-bold h-9 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 border-border/60">
                                            <Download className="size-3.5 mr-2 transition-transform group-hover:-translate-y-0.5" />
                                            Download
                                        </Button>
                                        <Button variant="outline" size="icon" className="size-9 rounded-2xl border-border/60 hover:bg-primary/5 hover:border-primary/20 transition-all">
                                            <ExternalLink className="size-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
