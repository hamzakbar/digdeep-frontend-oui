import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface DashboardForecastControlsProps {
    frequency: string
    onFrequencyChange: (value: string) => void
    horizon: number
    onHorizonChange: (value: number) => void
    method: string
    onMethodChange: (value: string) => void
    className?: string
}

export function DashboardForecastControls({
    frequency,
    onFrequencyChange,
    horizon,
    onHorizonChange,
    method,
    onMethodChange,
    className
}: DashboardForecastControlsProps) {
    return (
        <Card className={cn("rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden", className)}>
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Forecast Controls</CardTitle>
                        <CardDescription className="text-xs font-medium">Configure forecast parameters</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    {/* Frequency */}
                    <div className="md:col-span-3 space-y-3">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Frequency</Label>
                        <Select value={frequency} onValueChange={onFrequencyChange}>
                            <SelectTrigger className="w-full rounded-xl h-11 border-border/40 font-bold hover:bg-muted/50 transition-all focus:ring-primary/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                <SelectItem value="W" className="rounded-xl font-bold text-xs py-2.5">Weekly</SelectItem>
                                <SelectItem value="M" className="rounded-xl font-bold text-xs py-2.5">Monthly</SelectItem>
                                <SelectItem value="D" className="rounded-xl font-bold text-xs py-2.5">Daily</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Horizon */}
                    <div className="md:col-span-5 space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Horizon</Label>
                            <span className="text-xs font-bold text-primary">{horizon} periods</span>
                        </div>
                        <div className="h-11 flex items-center px-1">
                            <Slider
                                value={[horizon]}
                                onValueChange={(vals) => onHorizonChange(vals[0])}
                                min={4}
                                max={26}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Method */}
                    <div className="md:col-span-4 space-y-3">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Charge Forecast Method</Label>
                        <Select value={method} onValueChange={onMethodChange}>
                            <SelectTrigger className="w-full rounded-xl h-11 border-border/40 font-bold hover:bg-muted/50 transition-all focus:ring-primary/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                <SelectItem value="ets" className="rounded-xl font-bold text-xs py-2.5">ETS (best)</SelectItem>
                                <SelectItem value="seasonal_naive" className="rounded-xl font-bold text-xs py-2.5">Seasonal Naive</SelectItem>
                                <SelectItem value="moving_average" className="rounded-xl font-bold text-xs py-2.5">Moving Average</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
