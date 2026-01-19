import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardStatsCardProps {
    title: string
    value: string
    icon: LucideIcon
    trend?: 'up' | 'down'
    loading?: boolean
    className?: string
}

export function DashboardStatsCard({ title, value, icon: Icon, loading, className }: DashboardStatsCardProps) {
    return (
        <Card className={cn(
            "rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 overflow-hidden group hover:border-primary/20 hover:bg-muted/30 transition-all duration-500 bg-card/30 backdrop-blur-md py-0 gap-0",
            className
        )}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <div className="p-6 pb-8 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{title}</span>
                    <div className="p-2.5 bg-primary/5 rounded-xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-700 ease-out">
                        <Icon className="size-4 text-primary" />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="text-3xl font-black tracking-tighter group-hover:translate-x-1 transition-transform duration-700 ease-out leading-none text-foreground flex items-baseline gap-2">
                        {value}
                        {/* {trend && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1",
                                trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                                {trend === 'up' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                            </span>
                        )} */}
                    </div>
                </div>
            </div>
        </Card>
    )
}
