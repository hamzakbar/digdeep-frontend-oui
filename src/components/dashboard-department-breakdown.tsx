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
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type DoctorDepartmentPoint } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const departmentBreakdownConfig = {
    charges: {
        label: "Charges",
        color: "var(--chart-1)",
    },
    payments: {
        label: "Payments",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface DashboardDepartmentBreakdownProps {
    data: DoctorDepartmentPoint[] | null
    selectedDoctor: string
    onDepartmentClick: (data: any) => void
    loading?: boolean
    className?: string
}

export function DashboardDepartmentBreakdown({
    data,
    selectedDoctor,
    onDepartmentClick,
    loading,
    className
}: DashboardDepartmentBreakdownProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Department Breakdown (click a bar)</CardTitle>
                        <CardDescription className="text-xs font-medium">Charges and payments by department</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] gap-2 flex flex-col">
                    {data && data.length > 0 ? (
                        <ChartContainer config={departmentBreakdownConfig} className="h-full w-full">
                            <BarChart
                                accessibilityLayer
                                data={data}
                                margin={{ top: 20, bottom: 20 }}
                                onClick={(state) => {
                                    if (state?.activePayload?.[0]?.payload) {
                                        onDepartmentClick(state.activePayload[0].payload)
                                    }
                                }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="department_name"
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
                                    barSize={20}
                                    className="cursor-pointer"
                                />
                                <Bar
                                    dataKey="payments"
                                    fill="var(--color-payments)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                    className="cursor-pointer"
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading...' : selectedDoctor === 'all' ? 'Select a doctor to see department breakdown' : 'No data available'}
                        </div>
                    )}
                </div>
                <div className="mt-10 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <Building2 className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Breakdown of financial performance by department. Click a bar to filter subsequent charts by that department.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
