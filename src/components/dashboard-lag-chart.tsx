import {
    BarChart,
    Bar,
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
    type ChartConfig,
} from "@/components/ui/chart"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { type LagPoint } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const lagChartConfig = {
    count: {
        label: "Count",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

interface DashboardLagChartProps {
    data: LagPoint[] | null
    loading?: boolean
    className?: string
}

export function DashboardLagChart({ data, loading, className }: DashboardLagChartProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Payment Lag Buckets</CardTitle>
                        <CardDescription className="text-xs font-medium">Distribution of days until payment</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {data && data.length > 0 ? (
                        <ChartContainer config={lagChartConfig} className="h-full w-full">
                            <BarChart
                                accessibilityLayer
                                data={data}
                                margin={{ top: 20, bottom: 20 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="bucket"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={11}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                    stroke="#888888"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={11}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                    stroke="#888888"
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="var(--color-count)"
                                    radius={[8, 8, 4, 4]}
                                    barSize={60}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading...' : 'No data available'}
                        </div>
                    )}
                </div>
                <div className="mt-8 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <Activity className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        How long it takes for a claim to get paid. Useful for identifying slow-paying payers or procedures.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
