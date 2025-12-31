import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList, Sparkles, Plus, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/session/$sessionId/planner')({
    component: PlannerPage,
})

function PlannerPage() {
    const { sessionId } = Route.useParams()

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">Project Planner</h1>
                    <p className="text-muted-foreground text-sm font-medium">Design and orchestrate your data analysis workflows.</p>
                </div>
                <Button className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                    <Plus className="size-5 mr-2" />
                    Create New Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="text-center py-40 glass rounded-[3.5rem] border-dashed border-primary/20 bg-primary/[0.02] flex flex-col items-center">
                    <div className="size-24 rounded-[2rem] bg-white shadow-2xl shadow-slate-200 flex items-center justify-center mb-8 relative">
                        <ClipboardList className="size-11 text-primary opacity-40" />
                        <Sparkles className="absolute -top-2 -right-2 size-6 text-accent animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black mb-3 opacity-80">Orchestrate Your Data Strategy</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto font-medium opacity-60 leading-relaxed mb-10">
                        The Planner allows you to break down complex analysis goals into executable steps. Define your objectives and let the agent help you map out the path.
                    </p>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="rounded-2xl h-11 px-8 border-border/60 hover:bg-white active:scale-95 transition-all">
                            Documentation
                        </Button>
                        <Button className="rounded-2xl h-11 px-8 active:scale-95 transition-all shadow-lg shadow-primary/10">
                            <PlayCircle className="size-4 mr-2" />
                            Quick Start
                        </Button>
                    </div>
                </div>
            </div>
            {/* Hidden sessionId for breadcrumbs or future use */}
            <span className="hidden">{sessionId}</span>
        </div>
    )
}
