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
import { useMemo } from "react"
import { ChartLoadingOverlay } from "@/components/chart-loading-overlay"

interface DashboardHeatmapProps {
    title?: string
    description?: string
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
    title = "Doctor x Department Heatmap",
    description = "Charges distribution by provider and department",
    data,
    matrix,
    departments,
    onDoctorClick,
    onDepartmentClick,
    onResetDoctor,
    loading,
    className
}: DashboardHeatmapProps) {
    const maxCharges = useMemo(() => {
        if (data && data.length > 0) return Math.max(...data.map(d => d.charges), 1)
        if (matrix && matrix.length > 0) {
            let max = 1
            matrix.forEach(row => {
                departments.forEach(dept => {
                    const val = row[dept]?.charges || 0
                    if (val > max) max = val
                })
            })
            return max
        }
        return 1
    }, [data, matrix, departments])

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
                                                    const cellData = row[dept] || { charges: 0, payments: 0 }
                                                    const val = cellData.charges
                                                    const payments = cellData.payments
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
                                                            >
                                                                {val > 0 ? (
                                                                    <>
                                                                        <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center pointer-events-none">
                                                                            <div className="text-[9px] font-bold text-white/70 uppercase tracking-tighter">Charges</div>
                                                                            <div className="text-[11px] font-black text-white">${(val || 0).toLocaleString()}</div>
                                                                            <div className="h-px w-8 bg-white/20 my-1" />
                                                                            <div className="text-[9px] font-bold text-white/70 uppercase tracking-tighter">Payments</div>
                                                                            <div className="text-[11px] font-black text-emerald-400">${(payments || 0).toLocaleString()}</div>
                                                                        </div>
                                                                        <span
                                                                            className="text-[10px] font-black tracking-tight z-10"
                                                                            style={{ color: intensity > 0.5 ? 'white' : 'inherit' }}
                                                                        >
                                                                            {cellData.label || `$${(val / 1000).toFixed(1)}k`}
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
