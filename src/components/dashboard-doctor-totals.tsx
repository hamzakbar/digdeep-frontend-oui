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
import { Users as UsersIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type DoctorTotal } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const doctorTotalsConfig = {
    charges: {
        label: "Charges",
        color: "var(--chart-1)",
    },
    payments: {
        label: "Payments",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface DashboardDoctorTotalsProps {
    data: DoctorTotal[] | null
    onBarClick: (data: any) => void
    loading?: boolean
    className?: string
}

export function DashboardDoctorTotals({ data, onBarClick, loading, className }: DashboardDoctorTotalsProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Doctor Totals (click a bar)</CardTitle>
                        <CardDescription className="text-xs font-medium">Charges and payments by provider</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full overflow-x-auto custom-scrollbar">
                    {data && data.length > 0 ? (
                        <div style={{ minWidth: Math.max(800, data.length * 60) }}>
                            <ChartContainer config={doctorTotalsConfig} className="h-[400px] w-full">
                                <BarChart
                                    accessibilityLayer
                                    data={data}
                                    margin={{
                                        top: 20,
                                        right: 20,
                                        left: 20,
                                        bottom: 60,
                                    }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="doctor"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        fontSize={10}
                                        fontFamily="Inter, sans-serif"
                                        fontWeight={600}
                                        stroke="#888888"
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={11}
                                        fontFamily="Inter, sans-serif"
                                        fontWeight={500}
                                        stroke="#888888"
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                    />
                                    <ChartTooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar
                                        dataKey="charges"
                                        fill="var(--color-charges)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        cursor="pointer"
                                        onClick={(data) => onBarClick(data)}
                                    />
                                    <Bar
                                        dataKey="payments"
                                        fill="var(--color-payments)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        cursor="pointer"
                                        onClick={(data) => onBarClick(data)}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading...' : 'No data available'}
                        </div>
                    )}
                </div>
                <div className="mt-6 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <UsersIcon className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Total charges and payments by doctor. Click a bar to focus drilldowns.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
