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
import { cn } from "@/lib/utils"

import { useMemo } from "react"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardCompareTrendProps {
    data: any[] | null
    config: ChartConfig
    loading?: boolean
    className?: string
}

export function DashboardCompareTrend({
    data,
    config,
    loading,
    className
}: DashboardCompareTrendProps) {
    const processedData = useMemo(() => {
        if (!data) return null
        const keys = Object.keys(config)
        return data.map(point => {
            const newPoint = { ...point }
            keys.forEach(key => {
                if (newPoint[key] === undefined || newPoint[key] === null) {
                    newPoint[key] = 0
                }
            })
            return newPoint
        })
    }, [data, config])

    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Compare Trend (2 doctors)</CardTitle>
                        <CardDescription className="text-xs font-medium">Charges vs payments over time for selected doctors</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {processedData && processedData.length > 0 ? (
                        <ChartContainer config={config} className="h-full w-full">
                            <LineChart
                                accessibilityLayer
                                data={processedData}
                                margin={{ top: 20, bottom: 20, left: 0, right: 0 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={11}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                    stroke="#888888"
                                    tickFormatter={(value) => format(new Date(value), "MMM dd")}
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
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                {Object.keys(config).map(key => (
                                    <Line
                                        key={key}
                                        dataKey={key}
                                        type="monotone"
                                        stroke={`var(--color-${key})`}
                                        strokeWidth={3}
                                        strokeDasharray={key.endsWith('_payments') ? "4 4" : "0"}
                                        dot={processedData.length === 1}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                ))}
                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {processedData === null ? 'Select 2 doctors to compare' : 'No data available'}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
