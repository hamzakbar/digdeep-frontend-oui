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
import { cn } from "@/lib/utils"

import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardCompareDepartmentsProps {
    data: any[] | null
    config: ChartConfig
    onBarClick: (data: { doctor: string }) => void
    loading?: boolean
    className?: string
}

export function DashboardCompareDepartments({
    data,
    config,
    onBarClick,
    loading,
    className
}: DashboardCompareDepartmentsProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Compare Departments (Charges & Payments)</CardTitle>
                        <CardDescription className="text-xs font-medium">Departmental performance comparison per doctor</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full">
                    {data && data.length > 0 ? (
                        <ChartContainer config={config} className="h-full w-full">
                            <BarChart
                                accessibilityLayer
                                data={data}
                                margin={{ top: 20, bottom: 20 }}
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
                                {Object.keys(config).map((key) => {
                                    const itemConfig = config[key];
                                    return (
                                        <Bar
                                            key={key}
                                            dataKey={key}
                                            fill={itemConfig?.color}
                                            radius={[4, 4, 0, 0]}
                                            cursor="pointer"
                                            onClick={() => {
                                                const docName = itemConfig?.label?.toString().split(' (')[0]
                                                if (docName) onBarClick({ doctor: docName })
                                            }}
                                        />
                                    )
                                })}
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {data === null ? 'Loading...' : 'No data available'}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
