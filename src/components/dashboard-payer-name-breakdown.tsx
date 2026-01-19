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
    type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const payerNameConfig = {
    payments: {
        label: "Payments",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface DashboardPayerNameBreakdownProps {
    data: any[] | null
    loading?: boolean
    className?: string
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="rounded-lg border bg-background p-4 shadow-xl min-w-[200px]">
                <div className="mb-2 border-b pb-2 border-border/50">
                    <h4 className="font-bold text-sm text-primary/90">{data.payer_name}</h4>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Payments</span>
                    <span className="font-semibold font-mono text-foreground">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.payments)}
                    </span>
                </div>
            </div>
        )
    }
    return null
}

export function DashboardPayerNameBreakdown({ data, loading, className }: DashboardPayerNameBreakdownProps) {
    // Sort and take top 20
    const chartData = data ? [...data]
        .sort((a, b) => b.payments - a.payments)
        .slice(0, 20) : []

    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Payer Name Breakdown</CardTitle>
                        <CardDescription className="text-xs font-medium">Top 20 payers by payments</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {chartData && chartData.length > 0 ? (
                        <ChartContainer config={payerNameConfig} className="h-[400px] w-full">
                            <BarChart
                                accessibilityLayer
                                data={chartData}
                                margin={{ top: 20, bottom: 60 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="payer_name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{
                                        fontSize: 10,
                                        fill: "#888888",
                                        fontFamily: "Inter, sans-serif",
                                        fontWeight: 600
                                    }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#888888",
                                        fontFamily: "Inter, sans-serif",
                                        fontWeight: 600
                                    }}
                                />
                                <ChartTooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    content={<CustomTooltip />}
                                />
                                <Bar
                                    dataKey="payments"
                                    fill="var(--color-payments)"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={60}
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/50">
                            <p className="text-sm font-medium">No payer data available</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
