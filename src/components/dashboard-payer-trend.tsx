import { useMemo } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardPayerTrendProps {
    data: any[] | null
    groups: string[]
    loading?: boolean
    className?: string
}

export function DashboardPayerTrend({ data, groups, loading, className }: DashboardPayerTrendProps) {
    const config = useMemo(() => {
        const cfg: any = {}
        groups.forEach((group, index) => {
            cfg[group] = {
                label: group,
                color: `var(--chart-${(index % 5) + 1})`
            }
        })
        return cfg
    }, [groups])

    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Payer Payments Trend</CardTitle>
                        <CardDescription className="text-xs font-medium">Payments over time grouped by payer source</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold">Monthly</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {data && data.length > 0 ? (
                        <ChartContainer config={config} className="h-full w-full">
                            <LineChart
                                accessibilityLayer
                                data={data}
                                margin={{
                                    left: 12,
                                    right: 12,
                                    bottom: 12
                                }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => format(new Date(value), "MMM yy")}
                                    fontSize={11}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                    stroke="#888888"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    fontSize={11}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                    stroke="#888888"
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                {groups.map((group) => (
                                    <Line
                                        key={group}
                                        dataKey={group}
                                        type="monotone"
                                        stroke={`var(--color-${group})`}
                                        strokeWidth={2}
                                        dot={data?.length === 1}
                                    />
                                ))}
                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading...' : 'No data available'}
                        </div>
                    )}
                </div>
                <div className="mt-8 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <Database className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Payments over time grouped by payer type/source. Shows shifts in payer mix and helps identify changes in revenue sources.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
