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
import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type CPTMixPoint } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

const cptMixConfig = {
    charges: {
        label: "Charges",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

interface DashboardCptMixProps {
    data: CPTMixPoint[] | null
    loading?: boolean
    className?: string
}

export function DashboardCptMix({ data, loading, className }: DashboardCptMixProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Top CPT Mix</CardTitle>
                        <CardDescription className="text-xs font-medium">Top CPT codes by charges</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[400px] w-full overflow-x-auto">
                    <div style={{ minWidth: (data?.length || 0) * 100 > 800 ? (data?.length || 0) * 100 : '100%' }}>
                        {data && data.length > 0 ? (
                            <ChartContainer config={cptMixConfig} className="h-[400px] w-full">
                                <BarChart
                                    accessibilityLayer
                                    data={data}
                                    margin={{ top: 20, bottom: 20 }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="CPTCode"
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
                                    <Bar
                                        dataKey="charges"
                                        fill="var(--color-charges)"
                                        radius={[8, 8, 4, 4]}
                                        barSize={40}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                {data === null ? 'Loading...' : 'No data available'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-10 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <BarChart3 className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Top CPT codes by charges in the selected period. Useful for procedure mix analysis and identifying revenue drivers.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
