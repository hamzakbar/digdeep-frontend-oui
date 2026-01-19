import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChartLoadingOverlayProps {
    isLoading: boolean
    className?: string
    text?: string
}

export function ChartLoadingOverlay({ isLoading, className, text = "Loading data..." }: ChartLoadingOverlayProps) {
    if (!isLoading) return null

    return (
        <div className={cn(
            "absolute inset-0 z-50 flex items-center justify-center",
            "bg-background/60 backdrop-blur-[2px] transition-all duration-300 animate-in fade-in",
            className
        )}>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background/80 border border-border/40 shadow-xl backdrop-blur-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs font-medium text-muted-foreground animate-pulse">{text}</p>
            </div>
        </div>
    )
}
