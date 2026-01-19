import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { type HeatmapPoint } from "@/lib/api"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardHeatmapProps {
    data: HeatmapPoint[] | null
    matrix: any[] | null
    departments: string[]
    onDoctorClick: (data: any) => void
    onDepartmentClick: (data: any) => void
    onResetDoctor: () => void
    loading?: boolean
    className?: string
}

export function DashboardHeatmap({
    data,
    matrix,
    departments,
    onDoctorClick,
    onDepartmentClick,
    onResetDoctor,
    loading,
    className
}: DashboardHeatmapProps) {
    const maxCharges = data ? Math.max(...data.map(d => d.charges), 1) : 1

    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500", className)}>
            <ChartLoadingOverlay isLoading={!!loading} />
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Doctor x Department Heatmap</CardTitle>
                        <CardDescription className="text-xs font-medium">Charges distribution by provider and department</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="h-[500px] w-full overflow-auto custom-scrollbar">
                    {matrix && matrix.length > 0 ? (
                        <div className="min-w-[800px]">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="relative z-20">
                                        <th
                                            className="sticky top-0 left-0 z-30 bg-card/95 backdrop-blur-md p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 border-r border-border/40 cursor-pointer hover:text-primary transition-colors"
                                            onClick={onResetDoctor}
                                        >
                                            Doctor
                                        </th>
                                        {departments.map(dept => (
                                            <th
                                                key={dept}
                                                className="sticky top-0 z-20 bg-card/95 backdrop-blur-md p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 min-w-[120px] cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => onDepartmentClick({ department: dept })}
                                            >
                                                {dept}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {matrix.map((row, idx) => {
                                        return (
                                            <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                                <td
                                                    className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm p-4 text-xs font-black border-b border-border/10 border-r border-border/40 cursor-pointer hover:text-primary transition-colors"
                                                    onClick={() => onDoctorClick({ doctor: row.doctor })}
                                                >
                                                    {row.doctor}
                                                </td>
                                                {departments.map(dept => {
                                                    const val = row[dept] || 0
                                                    // Use logarithmic scale for better visual distribution
                                                    const intensity = val > 0 ? Math.log(val + 1) / Math.log(maxCharges + 1) : 0

                                                    return (
                                                        <td
                                                            key={dept}
                                                            className="p-0 border-b border-border/10 border-r border-border/10 cursor-pointer"
                                                            onClick={() => {
                                                                onDoctorClick({ doctor: row.doctor });
                                                                onDepartmentClick({ department: dept });
                                                            }}
                                                        >
                                                            <div
                                                                className="w-full h-12 flex flex-col items-center justify-center transition-all group/cell relative overflow-hidden"
                                                                style={{
                                                                    backgroundColor: val > 0
                                                                        ? `color-mix(in srgb, var(--chart-1), transparent ${Math.round(100 - (intensity * 100))}%)`
                                                                        : 'rgba(0,0,0,0.02)',
                                                                }}
                                                                title={`${row.doctor} - ${dept}: $${val.toLocaleString()}`}
                                                            >
                                                                {val > 0 ? (
                                                                    <>
                                                                        <span
                                                                            className="text-[10px] font-black tracking-tight z-10"
                                                                            style={{ color: intensity > 0.5 ? 'white' : 'inherit' }}
                                                                        >
                                                                            ${(val / 1000).toFixed(1)}k
                                                                        </span>
                                                                        <div
                                                                            className="absolute inset-0 bg-white/20 opacity-0 group-hover/cell:opacity-100 transition-opacity"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] font-medium opacity-20">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {matrix === null ? 'Loading heatmap...' : 'No data available'}
                        </div>
                    )}
                </div>
                <div className="mt-10 flex items-center gap-2 text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-border/10">
                    <Layers className="size-4 text-primary" />
                    <p className="text-[10px] font-medium leading-relaxed">
                        Heatmap of charges by doctor and department. Darker cells indicate higher billed amounts. Use it to identify specialty-based revenue patterns.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
