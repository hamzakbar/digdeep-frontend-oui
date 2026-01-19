import { format } from "date-fns"
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
    type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type TimeSeriesPoint } from "@/lib/api"

const trendChartConfig = {
    charges: {
        label: "Charges",
        color: "var(--chart-1)",
    },
    payments: {
        label: "Payments",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

import { useMemo } from "react"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardTrendChartProps {
    data: TimeSeriesPoint[] | null
    loading?: boolean
    className?: string
}

export function DashboardTrendChart({ data, loading, className }: DashboardTrendChartProps) {
    const processedData = useMemo(() => {
        if (!data) return null
        return data.map(point => ({
            ...point,
            charges: point.charges ?? 0,
            payments: point.payments ?? 0
        }))
    }, [data])

    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Charges vs Payments (Trend)</CardTitle>
                        <CardDescription className="text-xs font-medium">Monthly total charges and payments over time</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 rounded-lg px-2 text-[10px] font-bold">LIVE UPDATE</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full overflow-hidden">
                    {processedData && processedData.length > 0 ? (
                        <ChartContainer config={trendChartConfig} className="h-full w-full">
                            <LineChart
                                accessibilityLayer
                                data={processedData}
                                margin={{
                                    left: 12,
                                    right: 12,
                                    bottom: 40,
                                }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => format(new Date(value), "MMM dd")}
                                    fontSize={11}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                    stroke="#888888"
                                    interval="preserveStartEnd"
                                    minTickGap={50}
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
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Line
                                    dataKey="charges"
                                    type="monotone"
                                    stroke="var(--color-charges)"
                                    strokeWidth={3}
                                    dot={data?.length === 1}
                                    activeDot={{
                                        r: 6,
                                    }}
                                />
                                <Line
                                    dataKey="payments"
                                    type="monotone"
                                    stroke="var(--color-payments)"
                                    strokeWidth={3}
                                    dot={data?.length === 1}
                                    activeDot={{
                                        r: 6,
                                    }}
                                />
                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic">
                            {data === null ? "Loading trend data..." : "No trend data available for selected filters"}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
