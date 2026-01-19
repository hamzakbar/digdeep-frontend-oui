import {
    AreaChart,
    Area,
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

import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardDepartmentForecastProps {
    title: string
    description: string
    data: any[] | null
    config: ChartConfig
    groups: string[]
    loading?: boolean
    className?: string
}

export function DashboardDepartmentForecast({
    title,
    description,
    data,
    config,
    groups,
    loading,
    className
}: DashboardDepartmentForecastProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">{title}</CardTitle>
                        <CardDescription className="text-xs font-medium">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {data && data.length > 0 ? (
                        <ChartContainer config={config} className="h-full w-full">
                            <AreaChart
                                accessibilityLayer
                                data={data}
                                margin={{ top: 10, bottom: 10, left: 0, right: 0 }}
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
                                {groups.map(group => {
                                    const normalizedDept = group.replace(/[^a-zA-Z0-9]/g, '_')
                                    return (
                                        <Area
                                            key={normalizedDept}
                                            dataKey={normalizedDept}
                                            type="monotone"
                                            fill={`var(--color-${normalizedDept})`}
                                            fillOpacity={0.4}
                                            stroke={`var(--color-${normalizedDept})`}
                                            stackId="1"
                                        />
                                    )
                                })}
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading forecast...' : 'No forecast data available'}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
