import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DollarSign, Wallet, Percent, Clock } from "lucide-react"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

export interface CompareKpiData {
    doctor_id: number
    doctor_name: string
    total_charges: number
    total_payments: number
    collection_rate: number
    lag_avg: number
    lag_median: number
}

interface DashboardCompareKpisProps {
    data: CompareKpiData[] | null
    loading?: boolean
    className?: string
}

export function DashboardCompareKpis({ data, loading, className }: DashboardCompareKpisProps) {
    if (!data || data.length !== 2) return null

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
            {data.map((docKpi) => (
                <Card key={docKpi.doctor_id} className="rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500 relative">
                    <ChartLoadingOverlay isLoading={!!loading} />
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-black text-primary">{docKpi.doctor_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <KpiItem
                                label="Total Charges"
                                value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(docKpi.total_charges)}
                                icon={DollarSign}
                                color="text-blue-500"
                            />
                            <KpiItem
                                label="Total Payments"
                                value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(docKpi.total_payments)}
                                icon={Wallet}
                                color="text-emerald-500"
                            />
                            <KpiItem
                                label="Collection Rate"
                                value={`${(docKpi.collection_rate * 100).toFixed(1)}%`}
                                icon={Percent}
                                color="text-amber-500"
                            />
                            <KpiItem
                                label="Avg Lag (Days)"
                                value={`${docKpi.lag_avg.toFixed(1)}d`}
                                subtitle={`Median: ${docKpi.lag_median.toFixed(1)}d`}
                                icon={Clock}
                                color="text-purple-500"
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

interface KpiItemProps {
    label: string
    value: string
    subtitle?: string
    icon: any
    color: string
}

function KpiItem({ label, value, subtitle, icon: Icon, color }: KpiItemProps) {
    return (
        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-muted/30 border border-border/10 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1.5 rounded-lg bg-background", color)}>
                    <Icon className="size-3" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-black tracking-tight">{value}</div>
            {subtitle && <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{subtitle}</div>}
        </div>
    )
}
