import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { type UnallocatedSummary } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardUnallocatedProps {
    data: UnallocatedSummary | null
    loading?: boolean
    className?: string
}

export function DashboardUnallocated({ data, loading, className }: DashboardUnallocatedProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                        <Wallet className="size-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg">Unallocated Payments</h3>
                        <p className="text-xs font-medium text-muted-foreground mt-1">Payments not yet assigned to specific charges</p>
                    </div>
                </div>
                <div className="text-right">
                    {data ? (
                        <>
                            <div className="text-3xl font-black tabular-nums tracking-tight">
                                ${data.unallocated_payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="ml-3 text-sm font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                                    ({(data.percent_unallocated * 100).toFixed(2)}%)
                                </span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-wider">
                                Total Payments: ${data.total_payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </>
                    ) : (
                        <div className="text-muted-foreground font-bold">Loading...</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
