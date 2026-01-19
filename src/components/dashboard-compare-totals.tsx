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
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { type DoctorCompareTotalPoint } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const compareTotalsConfig = {
    charges: {
        label: "Charges",
        color: "var(--chart-1)",
    },
    payments: {
        label: "Payments",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface DashboardCompareTotalsProps {
    data: DoctorCompareTotalPoint[] | null
    onBarClick: (data: any) => void
    loading?: boolean
    className?: string
}

export function DashboardCompareTotals({
    data,
    onBarClick,
    loading,
    className
}: DashboardCompareTotalsProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Compare Totals</CardTitle>
                        <CardDescription className="text-xs font-medium">Side-by-side totals for selected doctors</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {data && data.length > 0 ? (
                        <ChartContainer config={compareTotalsConfig} className="h-full w-full">
                            <BarChart
                                accessibilityLayer
                                data={data}
                                margin={{ top: 20, bottom: 20 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="doctor"
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
                                <Bar
                                    dataKey="charges"
                                    fill="var(--color-charges)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                    className="cursor-pointer"
                                    onClick={onBarClick}
                                />
                                <Bar
                                    dataKey="payments"
                                    fill="var(--color-payments)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                    className="cursor-pointer"
                                    onClick={onBarClick}
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Select 2 doctors to compare' : 'No data available'}
                        </div>
                    )}
                </div>
                <div className="mt-10 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <User className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Total aggregated charges and payments for the selected time period.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
