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
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

import { useMemo } from "react"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const forecastConfig = {
    charges_actual: { label: "Actual Charges", color: "var(--chart-1)" },
    payments_actual: { label: "Actual Payments", color: "var(--chart-2)" },
    charges_forecast: { label: "Forecast Charges", color: "var(--chart-1)" },
    payments_forecast: { label: "Forecast Payments", color: "var(--chart-2)" },
} satisfies ChartConfig

interface DashboardOverallForecastProps {
    data: any[] | null
    loading?: boolean
    className?: string
}

export function DashboardOverallForecast({
    data,
    loading,
    className
}: DashboardOverallForecastProps) {
    const processedData = useMemo(() => {
        if (!data) return null
        return data.map(point => ({
            ...point,
            charges_actual: point.charges_actual ?? 0,
            payments_actual: point.payments_actual ?? 0,
            charges_forecast: point.charges_forecast ?? 0,
            payments_forecast: point.payments_forecast ?? 0
        }))
    }, [data])

    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Overall Forecast (Charges TS, Payments Lag Kernel)</CardTitle>
                        <CardDescription className="text-xs font-medium">Projected financial performance based on historical trends</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full aspect-auto">
                    {processedData && processedData.length > 0 ? (
                        <ChartContainer config={forecastConfig} className="h-full w-full">
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
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                                    }}
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
                                <Line
                                    dataKey="charges_actual"
                                    type="monotone"
                                    stroke="var(--color-charges_actual)"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    dataKey="payments_actual"
                                    type="monotone"
                                    stroke="var(--color-payments_actual)"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    dataKey="charges_forecast"
                                    type="monotone"
                                    stroke="var(--color-charges_forecast)"
                                    strokeWidth={3}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    dataKey="payments_forecast"
                                    type="monotone"
                                    stroke="var(--color-payments_forecast)"
                                    strokeWidth={3}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading forecast...' : 'No forecast data available'}
                        </div>
                    )}
                </div>
                <div className="mt-10 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <TrendingUp className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Dotted lines represent forecasted values. The model uses historical patterns to project future performance.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
