import { createFileRoute } from '@tanstack/react-router'
import { Card } from "@/components/ui/card"
import {
    Filter,
    Calendar as CalendarIcon,
    ChevronDown,
    X,
    LayoutDashboard,
    Search, Target,
    Building2,
    UsersIcon,
    ChevronUp,
    ListFilter,
    TrendingUp,
    GitCompare,
    CreditCard,
    DollarSign,
    Percent,
    Layers,
    User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { useEffect } from 'react'
import {
    fetchKPIs,
    fetchDoctorTimeSeries,
    fetchDoctorTotals,
    fetchPaymentLag,
    fetchPayerTrend,
    fetchCPTMix,
    fetchUnpaidCPT,
    fetchUnallocatedPayments,
    fetchDoctorDepartments, fetchLookups,
    fetchDoctorCompare,
    fetchHeatmap,
    fetchPayerSummary,
    // fetchOverallForecast,
    // fetchDeptForecast,
    type DashboardFilter,
    type KPIData,
    type TimeSeriesPoint,
    type DoctorTotal,
    type LagData,
    type CPTMixPoint,
    type UnpaidCPTPoint,
    type UnallocatedSummary,
    type DoctorDepartmentPoint,
    type DoctorDepartmentCPTPoint,
    type Lookups,
    type DoctorCompareData,
    type HeatmapPoint,
    // type ForecastData,
    fetchDoctorDepartmentCPTsMulti
} from '@/lib/api'

import { DashboardStatsCard } from '@/components/dashboard-stats-card'
import { DashboardTrendChart } from '@/components/dashboard-trend-chart'
import { DashboardDoctorTotals } from '@/components/dashboard-doctor-totals'
import { DashboardHeatmap } from '@/components/dashboard-heatmap'
import { DashboardLagChart } from '@/components/dashboard-lag-chart'
import { DashboardPayerTrend } from '@/components/dashboard-payer-trend'
import { DashboardCptMix } from '@/components/dashboard-cpt-mix'
import { DashboardUnpaidCpt } from '@/components/dashboard-unpaid-cpt'
import { DashboardUnallocated } from '@/components/dashboard-unallocated'
import { DashboardDepartmentBreakdown } from '@/components/dashboard-department-breakdown'
import { DashboardCptBreakdown } from '@/components/dashboard-cpt-breakdown'
import { DashboardCompareTrend } from '@/components/dashboard-compare-trend'
import { DashboardCompareTotals } from '@/components/dashboard-compare-totals'
import { DashboardCompareKpis, type CompareKpiData } from '@/components/dashboard-compare-kpis'
import { DashboardCompareBar } from '@/components/dashboard-compare-bar'

export const Route = createFileRoute('/session/$sessionId/dashboard')({
    component: SessionDashboard,
})

function SessionDashboard() {
    const { sessionId } = Route.useParams()

    // Filter States
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const now = new Date()
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return {
            from: startOfCurrentMonth,
            to: now
        }
    })
    const [dateBasis, setDateBasis] = useState<'entry' | 'service'>('entry')
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
    const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
    const [compareDoctors, setCompareDoctors] = useState<string[]>([])
    const [payerGroupBy, setPayerGroupBy] = useState<'payer_type' | 'payer_source_label' | 'payer_name'>('payer_type')
    const [topN, setTopN] = useState<number>(15)
    // const [forecastFrequency, setForecastFrequency] = useState<string>('W')
    // const [forecastHorizon, setForecastHorizon] = useState<number>(12)
    // const [forecastMethod, setForecastMethod] = useState<string>('ets')

    // Loading States
    const [isLoadingKPIs, setIsLoadingKPIs] = useState(false)
    const [isLoadingTimeSeries, setIsLoadingTimeSeries] = useState(false)
    const [isLoadingDoctorTotals, setIsLoadingDoctorTotals] = useState(false)
    const [isLoadingLag, setIsLoadingLag] = useState(false)
    const [isLoadingPayerTrend, setIsLoadingPayerTrend] = useState(false)
    const [isLoadingCPT, setIsLoadingCPT] = useState(false)
    const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false)
    const [isLoadingDrilldownDepts, setIsLoadingDrilldownDepts] = useState(false)
    const [isLoadingDrilldownCPTs, setIsLoadingDrilldownCPTs] = useState(false)
    const [isLoadingCompare, setIsLoadingCompare] = useState(false)
    // const [isLoadingForecasts, setIsLoadingForecasts] = useState(false)

    const [lookups, setLookups] = useState<Lookups>({ doctors: [], departments: [], facilities: [] })

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const data = await fetchLookups()
                setLookups(data)
            } catch (error) {
                console.error("Failed to fetch lookups:", error)
            }
        }
        loadLookups()
    }, [])


    const deptNameToIds = useMemo(() => {
        const mapping: Record<string, number[]> = {}
        lookups.departments.forEach(d => {
            if (!mapping[d.name]) mapping[d.name] = []
            mapping[d.name].push(d.id)
        })
        return mapping
    }, [lookups.departments])

    const resolveDeptIds = (name: string) => {
        if (!name || name === 'all') return undefined
        return deptNameToIds[name]
    }

    const [kpiData, setKpiData] = useState<KPIData | null>(null)

    useEffect(() => {
        const loadKPIs = async () => {
            setIsLoadingKPIs(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchKPIs(filters)
                setKpiData(data)
            } catch (error) {
                console.error("Failed to fetch KPIs:", error)
            } finally {
                setIsLoadingKPIs(false)
            }
        }
        loadKPIs()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities])

    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[] | null>(null)

    useEffect(() => {
        const loadTimeSeries = async () => {
            setIsLoadingTimeSeries(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchDoctorTimeSeries(filters)

                // Aggregate data by date (sum charges and payments for each date)
                const aggregatedMap = new Map<string, { charges: number; payments: number }>()
                data.forEach(point => {
                    const existing = aggregatedMap.get(point.date)
                    if (existing) {
                        existing.charges += point.charges
                        existing.payments += point.payments
                    } else {
                        aggregatedMap.set(point.date, { charges: point.charges, payments: point.payments })
                    }
                })

                // Convert map to array and sort by date
                const aggregatedData: TimeSeriesPoint[] = Array.from(aggregatedMap.entries())
                    .map(([date, values]) => ({ date, ...values }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                setTimeSeriesData(aggregatedData)
            } catch (error) {
                console.error("Failed to fetch time series:", error)
            } finally {
                setIsLoadingTimeSeries(false)
            }
        }
        loadTimeSeries()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities])

    const [doctorTotalsData, setDoctorTotalsData] = useState<DoctorTotal[] | null>(null)

    useEffect(() => {
        const loadDoctorTotals = async () => {
            setIsLoadingDoctorTotals(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchDoctorTotals(filters)
                // Limit to top 20 if no specific doctor is selected
                const limitedData = selectedDoctor === 'all' ? data.slice(0, 20) : data
                setDoctorTotalsData(limitedData)
            } catch (error) {
                console.error("Failed to fetch doctor totals:", error)
            } finally {
                setIsLoadingDoctorTotals(false)
            }
        }
        loadDoctorTotals()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities])

    const [lagData, setLagData] = useState<LagData | null>(null)

    useEffect(() => {
        const loadLagData = async () => {
            setIsLoadingLag(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchPaymentLag(filters)
                setLagData(data)
            } catch (error) {
                console.error("Failed to fetch lag data:", error)
            } finally {
                setIsLoadingLag(false)
            }
        }
        loadLagData()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities])

    const [payerTrendData, setPayerTrendData] = useState<any[] | null>(null)
    const [payerGroups, setPayerGroups] = useState<string[]>([])

    useEffect(() => {
        const loadPayerTrend = async () => {
            setIsLoadingPayerTrend(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined,
                payer_groupby: payerGroupBy
            }
            try {
                const data = await fetchPayerTrend(filters)

                // Pivot data: group by date
                const pivotedMap = new Map<string, any>()
                const groups = new Set<string>()

                data.forEach(point => {
                    const dateStr = point.date
                    groups.add(point.payer_group)

                    if (!pivotedMap.has(dateStr)) {
                        pivotedMap.set(dateStr, { date: dateStr })
                    }
                    const row = pivotedMap.get(dateStr)
                    row[point.payer_group] = point.payments
                })

                const pivotedData = Array.from(pivotedMap.values())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                setPayerTrendData(pivotedData)
                setPayerGroups(Array.from(groups))
            } catch (error) {
                console.error("Failed to fetch payer trend:", error)
            } finally {
                setIsLoadingPayerTrend(false)
            }
        }
        loadPayerTrend()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities, payerGroupBy])



    const [cptMixApiData, setCptMixApiData] = useState<CPTMixPoint[] | null>(null)
    const [unpaidCptApiData, setUnpaidCptApiData] = useState<UnpaidCPTPoint[] | null>(null)
    const [unallocatedData, setUnallocatedData] = useState<UnallocatedSummary | null>(null)

    useEffect(() => {
        const loadCPTData = async () => {
            setIsLoadingCPT(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined,
                top_n: topN
            }
            try {
                const mix = await fetchCPTMix(filters)
                setCptMixApiData(mix)
                const unpaid = await fetchUnpaidCPT(filters)
                setUnpaidCptApiData(unpaid)
                const unalloc = await fetchUnallocatedPayments(filters)
                setUnallocatedData(unalloc)
            } catch (error) {
                console.error("Failed to fetch CPT data:", error)
            } finally {
                setIsLoadingCPT(false)
            }
        }
        loadCPTData()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities, topN])

    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[] | null>(null)
    const [heatmapMatrix, setHeatmapMatrix] = useState<{ doctor: string, [dept: string]: any }[] | null>(null)
    const [heatmapDepts, setHeatmapDepts] = useState<string[]>([])

    useEffect(() => {
        const loadHeatmap = async () => {
            setIsLoadingHeatmap(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchHeatmap(filters)
                setHeatmapData(data)

                // Sort docs and depts for consistent grid
                const docs = Array.from(new Set(data.map(d => d.doctor))).sort()
                const depts = Array.from(new Set(data.map(d => d.department))).sort()
                setHeatmapDepts(depts)

                const matrix = docs.map(doc => {
                    const row: any = { doctor: doc }
                    depts.forEach(dept => {
                        const match = data.find(d => d.doctor === doc && d.department === dept)
                        row[dept] = match ? { charges: match.charges, payments: match.payments } : { charges: 0, payments: 0 }
                    })
                    return row
                })
                setHeatmapMatrix(matrix)
            } catch (error) {
                console.error("Failed to fetch heatmap:", error)
            } finally {
                setIsLoadingHeatmap(false)
            }
        }
        loadHeatmap()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities])

    const [drilldownDepartmentData, setDrilldownDepartmentData] = useState<DoctorDepartmentPoint[] | null>(null)
    const [drilldownCptData, setDrilldownCptData] = useState<DoctorDepartmentCPTPoint[] | null>(null)

    useEffect(() => {
        const loadDrilldownDepartments = async () => {
            if (selectedDoctor === 'all') {
                setDrilldownDepartmentData([])
                return
            }
            setIsLoadingDrilldownDepts(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: [parseInt(selectedDoctor)],
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchDoctorDepartments(filters)
                setDrilldownDepartmentData(data)
            } catch (error) {
                console.error("Failed to fetch drilldown departments:", error)
            } finally {
                setIsLoadingDrilldownDepts(false)
            }
        }
        loadDrilldownDepartments()
    }, [dateRange, dateBasis, selectedDoctor, selectedFacilities])

    useEffect(() => {
        const loadDrilldownCPTs = async () => {
            if (selectedDoctor === 'all' || selectedDepartment === 'all') {
                setDrilldownCptData([])
                return
            }
            setIsLoadingDrilldownCPTs(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: [parseInt(selectedDoctor)],
                department_ids: resolveDeptIds(selectedDepartment),
                facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined
            }
            try {
                const data = await fetchDoctorDepartmentCPTsMulti(filters)
                setDrilldownCptData(data)
            } catch (error) {
                console.error("Failed to fetch drilldown CPTs:", error)
            } finally {
                setIsLoadingDrilldownCPTs(false)
            }
        }
        loadDrilldownCPTs()
    }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities])


    const [compareApiData, setCompareApiData] = useState<DoctorCompareData | null>(null)
    const [compareKpiData, setCompareKpiData] = useState<CompareKpiData[] | null>(null)
    const [compareTrendPivoted, setCompareTrendPivoted] = useState<any[] | null>(null)
    const [compareHeatmapMatrix, setCompareHeatmapMatrix] = useState<{ doctor: string, [dept: string]: any }[] | null>(null)
    const [compareHeatmapDepts, setCompareHeatmapDepts] = useState<string[]>([])
    const [compareCptHeatmapMatrix, setCompareCptHeatmapMatrix] = useState<any[] | null>(null)
    const [compareCptHeatmapCodes, setCompareCptHeatmapCodes] = useState<string[]>([])
    const [comparePayerMixPivoted, setComparePayerMixPivoted] = useState<any[] | null>(null)
    const [compareCptOverlapPivoted, setCompareCptOverlapPivoted] = useState<any[] | null>(null)
    const [compareLagPivoted, setCompareLagPivoted] = useState<any[] | null>(null)
    const [compareDeptMixMatrix, setCompareDeptMixMatrix] = useState<any[] | null>(null)

    useEffect(() => {
        const loadCompareData = async () => {
            if (compareDoctors.length !== 2) {
                setCompareApiData(null)
                setCompareTrendPivoted([])
                setCompareKpiData(null)
                setCompareCptHeatmapMatrix(null)
                setComparePayerMixPivoted(null)
                setCompareCptOverlapPivoted(null)
                setCompareLagPivoted(null)
                setCompareDeptMixMatrix(null)
                return
            }
            setIsLoadingCompare(true)
            const filters: DashboardFilter = {
                start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                date_basis: dateBasis,
                doctor_ids: compareDoctors.map(id => parseInt(id)),
                top_n: topN
            }
            try {
                const data = await fetchDoctorCompare(filters)
                if (!data) {
                    throw new Error("No data returned from doctor-compare")
                }
                setCompareApiData(data)

                // KPI Data for comparison cards
                const kpis: CompareKpiData[] = await Promise.all(compareDoctors.map(async (docId) => {
                    const docIdInt = parseInt(docId)
                    const fDoc: DashboardFilter = {
                        start_date: filters.start_date,
                        end_date: filters.end_date,
                        date_basis: filters.date_basis,
                        doctor_ids: [docIdInt]
                    }
                    const lagResp = await fetchPaymentLag(fDoc)
                    const totals = (data.totals || []).find(t => t.doctor_id === docIdInt)

                    return {
                        doctor_id: docIdInt,
                        doctor_name: totals?.doctor || `Doctor ${docId}`,
                        total_charges: totals?.charges || 0,
                        total_payments: totals?.payments || 0,
                        collection_rate: totals?.charges ? (totals.payments / totals.charges) : 0,
                        lag_avg: lagResp.summary.avg,
                        lag_median: lagResp.summary.median
                    }
                }))
                setCompareKpiData(kpis)

                // Pivot series for trend chart (CUMULATIVE as per dashboard.py)
                const seriesMap = new Map<string, any>()
                const seriesData = data.series || []
                const sortedPoints = [...seriesData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                const runningTotals: Record<string, { charges: number, payments: number }> = {}
                sortedPoints.forEach(p => {
                    const dStr = p.date
                    if (!seriesMap.has(dStr)) seriesMap.set(dStr, { date: dStr })
                    const row = seriesMap.get(dStr)
                    const docName = p?.doctor || "Unknown"
                    if (!runningTotals[docName]) runningTotals[docName] = { charges: 0, payments: 0 }

                    runningTotals[docName].charges += (p?.charges || 0)
                    runningTotals[docName].payments += (p?.payments || 0)

                    const docClean = docName.replace(/[^a-zA-Z0-9]/g, '_')
                    row[`${docClean}_charges`] = runningTotals[docName].charges
                    row[`${docClean}_payments`] = runningTotals[docName].payments
                })
                setCompareTrendPivoted(Array.from(seriesMap.values()))

                // Create heatmap matrix for comparison
                const departmentsData = data.departments || {}
                const compDepts = Array.from(new Set(Object.values(departmentsData).flatMap(d => (d || []).map(dp => dp.department_name)))).sort()
                setCompareHeatmapDepts(compDepts)

                const compMatrix = compareDoctors.map(docId => {
                    const doc = lookups.doctors.find(d => d.id.toString() === docId)
                    const docName = doc?.name || `Doctor ${docId}`
                    const row: any = { doctor: docName }
                    // Try matching docDepts by ID or by Name
                    const docDepts = departmentsData[docId] || departmentsData[docName] || []
                    compDepts.forEach(dept => {
                        const match = docDepts.find(d => d?.department_name === dept)
                        row[dept] = match ? { charges: match.charges || 0, payments: match.payments || 0 } : { charges: 0, payments: 0 }
                    })
                    return row
                })
                setCompareHeatmapMatrix(compMatrix)

                // CPT Heatmap
                const cptHeatmap = data?.cpt_heatmap || []
                const cptCodes = Array.from(new Set(cptHeatmap.filter(c => !!c?.CPTCode).map(c => c.CPTCode))).sort()
                setCompareCptHeatmapCodes(cptCodes as string[])
                const cptMatrix = compareDoctors.map(docId => {
                    const doc = lookups.doctors.find(d => d.id.toString() === docId)
                    const docName = doc?.name || `Doctor ${docId}`
                    const row: any = { doctor: docName }
                    cptCodes.forEach(code => {
                        // Match by ID if available, otherwise by Name
                        const match = cptHeatmap.find(c =>
                            (c?.doctor_id?.toString() === docId || c?.doctor === docName) &&
                            c?.CPTCode === code
                        )
                        row[code as string] = match ? { charges: match.charges || 0, payments: match.payments || 0 } : { charges: 0, payments: 0 }
                    })
                    return row
                })
                setCompareCptHeatmapMatrix(cptMatrix)

                // Payer mix, CPT mix, Lag side-by-side
                const payerMap = new Map<string, any>()
                const cptOverlapMap = new Map<string, any>()
                const lagBucketMap = new Map<string, any>()

                await Promise.all(compareDoctors.map(async (docId) => {
                    const docName = lookups.doctors.find(d => d.id.toString() === docId)?.name || `Doctor ${docId}`
                    const docClean = docName.replace(/[^a-zA-Z0-9]/g, '_')
                    const fDoc = { ...filters, doctor_ids: [parseInt(docId)] }

                    const [payerResp, cptResp, lagResp] = await Promise.all([
                        fetchPayerSummary(fDoc),
                        fetchCPTMix(fDoc),
                        fetchPaymentLag(fDoc)
                    ])

                    // Payer Mix (Payments)
                    payerResp.payers.forEach((p: any) => {
                        if (!payerMap.has(p.payer_type)) payerMap.set(p.payer_type, { payer_type: p.payer_type })
                        payerMap.get(p.payer_type)[docClean] = (payerMap.get(p.payer_type)[docClean] || 0) + p.payments
                    })

                    // CPT Mix Overlap (% charges)
                    const totalCharges = (cptResp || []).reduce((acc: number, c: CPTMixPoint) => acc + (c?.charges || 0), 0)
                        ; (cptResp || []).forEach((c: CPTMixPoint) => {
                            if (!c?.CPTCode) return
                            if (!cptOverlapMap.has(c.CPTCode)) cptOverlapMap.set(c.CPTCode, { CPTCode: c.CPTCode, ProcedureDescription: c.ProcedureDescription })
                            cptOverlapMap.get(c.CPTCode)[docClean] = totalCharges ? ((c?.charges || 0) / totalCharges) * 100 : 0
                        })

                        // Lag Distribution
                        ; (lagResp?.buckets || []).forEach((b: any) => {
                            if (!b?.bucket) return
                            if (!lagBucketMap.has(b.bucket)) lagBucketMap.set(b.bucket, { bucket: b.bucket })
                            lagBucketMap.get(b.bucket)[docClean] = b.count || 0
                        })
                }))

                setComparePayerMixPivoted(Array.from(payerMap.values()))
                setCompareCptOverlapPivoted(Array.from(cptOverlapMap.values()))
                setCompareLagPivoted(Array.from(lagBucketMap.values()))

                // Dept Mix % Heatmap
                const deptMixMatrix = compareDoctors.map(docId => {
                    const doc = lookups.doctors.find(d => d.id.toString() === docId)
                    const docName = doc?.name || `Doctor ${docId}`
                    const row: any = { doctor: docName }
                    // Try matching docDepts by ID or by Name
                    const docDepts = departmentsData[docId] || departmentsData[docName] || []
                    const totalDocCharges = (docDepts || []).reduce((acc: number, d) => acc + (d?.charges || 0), 0)
                    compDepts.forEach(dept => {
                        const match = docDepts.find(d => d?.department_name === dept)
                        const pct = totalDocCharges ? ((match?.charges || 0) / totalDocCharges) : 0
                        row[dept] = { charges: pct * 100, payments: 0, label: match ? `${(pct * 100).toFixed(1)}%` : '0%' }
                    })
                    return row
                })
                setCompareDeptMixMatrix(deptMixMatrix)

            } catch (error) {
                console.error("Failed to fetch comparison data:", error)
                // Set empty states to clear loading indicators if fetch fails
                setCompareTrendPivoted([])
                setCompareHeatmapMatrix([])
                setCompareCptHeatmapMatrix([])
                setCompareDeptMixMatrix([])
                setComparePayerMixPivoted([])
                setCompareCptOverlapPivoted([])
                setCompareLagPivoted([])
            } finally {
                setIsLoadingCompare(false)
            }
        }
        loadCompareData()
    }, [dateRange, dateBasis, compareDoctors, lookups.doctors, topN])

    const CptOverlapTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="rounded-lg border bg-background p-4 shadow-xl min-w-[300px] max-w-[400px]">
                    <div className="mb-3 border-b pb-2 border-border/50">
                        <h4 className="font-bold text-base text-primary/90">{data.CPTCode}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{data.ProcedureDescription}</p>
                    </div>
                    <div className="grid gap-2">
                        {payload.map((entry: any) => (
                            <div key={entry.dataKey} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground font-medium" style={{ color: entry.color }}>
                                    {entry.name}
                                </span>
                                <span className="font-semibold font-mono text-foreground">
                                    {entry.value.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    const compareTrendDynamicConfig = useMemo(() => {
        if (compareDoctors.length !== 2) return {}
        const config: any = {}
        const colors = ["var(--chart-1)", "var(--chart-2)"]
        compareDoctors.forEach((id, idx) => {
            const doc = lookups.doctors.find(d => d.id.toString() === id)
            const docName = doc?.name || `Doctor ${id}`
            const docClean = docName.replace(/[^a-zA-Z0-9]/g, '_')
            config[`${docClean}_charges`] = {
                label: `${docName} Charges`,
                color: colors[idx] || "var(--chart-1)"
            }
            config[`${docClean}_payments`] = {
                label: `${docName} Payments`,
                color: colors[idx] || "var(--chart-2)"
            }
        })
        return config
    }, [compareDoctors, lookups.doctors])

    const compareBarDynamicConfig = useMemo(() => {
        if (compareDoctors.length !== 2) return {}
        const config: any = {}
        const colors = ["var(--chart-1)", "var(--chart-2)"]
        compareDoctors.forEach((id, idx) => {
            const doc = lookups.doctors.find(d => d.id.toString() === id)
            const docName = doc?.name || `Doctor ${id}`
            const docClean = docName.replace(/[^a-zA-Z0-9]/g, '_')
            config[docClean] = {
                label: docName,
                color: colors[idx] || `var(--chart-${idx + 1})`
            }
        })
        return config
    }, [compareDoctors, lookups.doctors])


    // const [overallForecast, setOverallForecast] = useState<ForecastData | null>(null)
    // const [overallForecastMetricPivoted, setOverallForecastMetricPivoted] = useState<any[] | null>(null)
    // const [deptChargesForecast, setDeptChargesForecast] = useState<any[] | null>(null)
    // const [deptPaymentsForecast, setDeptPaymentsForecast] = useState<any[] | null>(null)
    // const [deptForecastGroups, setDeptForecastGroups] = useState<string[]>([])

    // useEffect(() => {
    //     const loadForecasts = async () => {
    //         setIsLoadingForecasts(true)
    //         const filters: DashboardFilter & { freq: string, horizon: number, charges_method: string } = {
    //             start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    //             end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    //             date_basis: dateBasis,
    //             doctor_ids: selectedDoctor !== 'all' ? [parseInt(selectedDoctor)] : undefined,
    //             department_ids: resolveDeptIds(selectedDepartment),
    //             facility_ids: selectedFacilities.length > 0 ? selectedFacilities.map(id => parseInt(id)) : undefined,
    //             payer_groupby: payerGroupBy,
    //             freq: forecastFrequency,
    //             horizon: forecastHorizon,
    //             charges_method: forecastMethod
    //         }
    //         try {
    //             const ofc = await fetchOverallForecast(filters)
    //             setOverallForecast(ofc)

    //             // Pivot overall forecast for dual line chart
    //             const overallMap = new Map<string, any>()
    //             ofc.rows.forEach(p => {
    //                 if (!overallMap.has(p.date)) overallMap.set(p.date, { date: p.date })
    //                 const row = overallMap.get(p.date)
    //                 row[`${p.metric}_actual`] = p.actual
    //                 row[`${p.metric}_forecast`] = p.forecast
    //             })
    //             setOverallForecastMetricPivoted(Array.from(overallMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))

    //             const dfc = await fetchDeptForecast(filters)
    //             // Pivot department forecasts
    //             const chMap = new Map<string, any>()
    //             const pmMap = new Map<string, any>()
    //             const groups = new Set<string>()

    //             dfc.rows.forEach(p => {
    //                 const normalizedDept = p.department.replace(/[^a-zA-Z0-9]/g, '_')
    //                 groups.add(p.department)
    //                 if (p.metric === 'charges') {
    //                     if (!chMap.has(p.date)) chMap.set(p.date, { date: p.date })
    //                     chMap.get(p.date)[normalizedDept] = p.forecast
    //                 } else {
    //                     if (!pmMap.has(p.date)) pmMap.set(p.date, { date: p.date })
    //                     pmMap.get(p.date)[normalizedDept] = p.forecast
    //                 }
    //             })
    //             setDeptChargesForecast(Array.from(chMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    //             setDeptPaymentsForecast(Array.from(pmMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    //             setDeptForecastGroups(Array.from(groups))

    //         } catch (error) {
    //             console.error("Failed to fetch forecasts:", error)
    //         } finally {
    //             setIsLoadingForecasts(false)
    //         }
    //     }
    //     loadForecasts()
    // }, [dateRange, dateBasis, selectedDoctor, selectedDepartment, selectedFacilities, payerGroupBy, forecastFrequency, forecastHorizon, forecastMethod])

    // const dynamicDeptForecastConfig = useMemo(() => {
    //     const config: any = {}
    //     deptForecastGroups.forEach((group, index) => {
    //         const normalizedDept = group.replace(/[^a-zA-Z0-9]/g, '_')
    //         config[normalizedDept] = {
    //             label: group,
    //             color: `var(--chart-${(index % 5) + 1})`
    //         }
    //     })
    //     return config
    // }, [deptForecastGroups])



    const handleDoctorBarClick = (data: any) => {
        const id = data?.doctor_id || data?.payload?.doctor_id
        if (id) {
            setSelectedDoctor(id.toString())
        } else if (data?.doctor || data?.payload?.doctor) {
            const name = data.doctor || data.payload.doctor
            const doc = lookups.doctors.find(d => d.name === name)
            if (doc) setSelectedDoctor(doc.id.toString())
        }
    }

    const handleDepartmentClick = (data: any) => {
        const name = data?.department_name || data?.payload?.department_name || data?.department || data?.payload?.department
        if (name) {
            setSelectedDepartment(name)
        }
    }

    const toggleFacility = (id: string) => {
        setSelectedFacilities(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleCompareDoctor = (id: string) => {
        setCompareDoctors(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id)
            if (prev.length >= 2) return [prev[1], id]
            return [...prev, id]
        })
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-3xl custom-scrollbar border-l border-border/40 min-w-0">
            <div className="max-w-[1400px] mx-auto p-8 pt-12 space-y-10">
                <header className="flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                                <Target className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">Analysis Dashboard</h1>
                                <p className="text-sm font-medium text-muted-foreground">Comprehensive insights for session: <span className="font-mono text-primary/80">{sessionId.substring(0, 12)}...</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <Card className="rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/40 backdrop-blur-2xl p-6 overflow-visible">
                        <div className="flex items-center gap-2 mb-6 px-1">
                            <Filter className="size-4 text-primary" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Analysis Filters</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {/* Date Range Picker */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <CalendarIcon className="size-3" />
                                    Date Range
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-bold rounded-xl h-11 border-border/40 hover:bg-muted/50 transition-all",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <span className="truncate">
                                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                    </span>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Charge Date Basis */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <Layers className="size-3" />
                                    Date Basis
                                </Label>
                                <RadioGroup
                                    value={dateBasis}
                                    onValueChange={(v: any) => setDateBasis(v)}
                                    className="flex items-center gap-2 h-11"
                                >
                                    <div className="flex-1">
                                        <RadioGroupItem value="entry" id="entry" className="peer sr-only" />
                                        <Label
                                            htmlFor="entry"
                                            className="flex items-center justify-center rounded-xl border-2 border-border/40 bg-transparent py-2.5 px-3 font-bold text-xs ring-offset-background transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer h-full"
                                        >
                                            Entry Date
                                        </Label>
                                    </div>
                                    <div className="flex-1">
                                        <RadioGroupItem value="service" id="service" className="peer sr-only" />
                                        <Label
                                            htmlFor="service"
                                            className="flex items-center justify-center rounded-xl border-2 border-border/40 bg-transparent py-2.5 px-3 font-bold text-xs ring-offset-background transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer h-full"
                                        >
                                            Service Date
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Facilities Multi-Select */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <Building2 className="size-3" />
                                    Facilities
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-bold rounded-xl h-11 border-border/40 hover:bg-muted/50 transition-all group overflow-hidden"
                                        >
                                            <Building2 className="mr-2 h-4 w-4 opacity-50" />
                                            {selectedFacilities.length > 0 ? (
                                                <div className="flex items-center gap-1 overflow-hidden">
                                                    <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-[10px] h-6 shrink-0">{selectedFacilities.length} Selected</Badge>
                                                    <span className="text-muted-foreground text-xs font-medium truncate opacity-60">
                                                        {selectedFacilities.map(id => lookups.facilities.find(f => f.id.toString() === id)?.name).join(", ")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="opacity-50">All Facilities</span>
                                            )}
                                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2 rounded-2xl border-border/40 shadow-2xl" align="start">
                                        <div className="space-y-1">
                                            {lookups.facilities.map(f => {
                                                const idStr = f.id.toString()
                                                return (
                                                    <button
                                                        key={idStr}
                                                        onClick={() => toggleFacility(idStr)}
                                                        className={cn(
                                                            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                                                            selectedFacilities.includes(idStr)
                                                                ? "bg-primary/10 text-primary"
                                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "size-4 rounded border-2 border-primary/20 flex items-center justify-center transition-all",
                                                            selectedFacilities.includes(idStr) ? "bg-primary border-primary" : ""
                                                        )}>
                                                            {selectedFacilities.includes(idStr) && <X className="size-3 text-white" />}
                                                        </div>
                                                        {f.name}
                                                    </button>
                                                )
                                            })}
                                            {selectedFacilities.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-center h-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedFacilities([]); }}
                                                >
                                                    Clear Selection
                                                </Button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Doctor Selection */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <User className="size-3" />
                                    Focus Doctor
                                </Label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                    <SelectTrigger className="w-full rounded-xl h-11 border-border/40 font-bold hover:bg-muted/50 transition-all focus:ring-primary/20">
                                        <SelectValue placeholder="All Doctors" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl max-h-64 overflow-y-auto">
                                        <SelectItem value="all" className="rounded-xl font-bold text-xs py-2.5">All Doctors</SelectItem>
                                        {lookups.doctors.map(d => {
                                            const idStr = d.id.toString()
                                            return (
                                                <SelectItem key={idStr} value={idStr} className="rounded-xl font-bold text-xs py-2.5">
                                                    {d.name}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department Selection */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <Target className="size-3" />
                                    Department
                                </Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-full rounded-xl h-11 border-border/40 font-bold hover:bg-muted/50 transition-all focus:ring-primary/20">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl max-h-64 overflow-y-auto">
                                        <SelectItem value="all" className="rounded-xl font-bold text-xs py-2.5">All Departments</SelectItem>
                                        {Array.from(new Set(lookups.departments.map(d => d.name))).sort().map(name => (
                                            <SelectItem key={name} value={name} className="rounded-xl font-bold text-xs py-2.5">
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Compare Doctors (exactly 2) */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <UsersIcon className="size-3" />
                                    Compare Doctors
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-bold rounded-xl h-11 border-border/40 hover:bg-muted/50 transition-all group overflow-hidden"
                                        >
                                            <UsersIcon className="mr-2 h-4 w-4 opacity-50" />
                                            {compareDoctors.length > 0 ? (
                                                <div className="flex items-center gap-1 overflow-hidden">
                                                    <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-[10px] h-6 shrink-0">{compareDoctors.length}/2</Badge>
                                                    <span className="text-muted-foreground text-xs font-medium truncate opacity-60">
                                                        {compareDoctors.map(id => lookups.doctors.find(d => d.id.toString() === id)?.name).join(" vs ")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="opacity-50">None</span>
                                            )}
                                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start">
                                        <div className="flex flex-col">
                                            <div className="h-6 flex items-center justify-center border-b border-border/10 bg-muted/20 text-muted-foreground/30">
                                                <ChevronUp className="size-3" />
                                            </div>
                                            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest px-3 py-2 sticky top-0 bg-popover/95 backdrop-blur-sm z-10">Select exactly 2</p>
                                                {lookups.doctors.map(d => {
                                                    const idStr = d.id.toString()
                                                    return (
                                                        <button
                                                            key={idStr}
                                                            onClick={() => toggleCompareDoctor(idStr)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                                                                compareDoctors.includes(idStr)
                                                                    ? "bg-primary/10 text-primary"
                                                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            {d.name}
                                                            {compareDoctors.includes(idStr) && (
                                                                <div className="size-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-black">
                                                                    {compareDoctors.indexOf(idStr) + 1}
                                                                </div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <div className="h-6 flex items-center justify-center border-t border-border/10 bg-muted/20 text-muted-foreground/30">
                                                <ChevronDown className="size-3" />
                                            </div>
                                        </div>
                                        <div className="p-2 border-t border-border/10">
                                            {compareDoctors.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-center h-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-600 rounded-lg group"
                                                    onClick={(e) => { e.stopPropagation(); setCompareDoctors([]); }}
                                                >
                                                    <X className="size-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    Reset Comparison
                                                </Button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Payer Grouping */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <ListFilter className="size-3" />
                                    Payer Grouping
                                </Label>
                                <Select value={payerGroupBy} onValueChange={(v: any) => setPayerGroupBy(v)}>
                                    <SelectTrigger className="w-full rounded-xl h-11 border-border/40 font-bold hover:bg-muted/50 transition-all focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                        <SelectItem value="payer_type" className="rounded-xl font-bold text-xs py-2.5">Payer Type</SelectItem>
                                        <SelectItem value="payer_source_label" className="rounded-xl font-bold text-xs py-2.5">Source</SelectItem>
                                        <SelectItem value="payer_name" className="rounded-xl font-bold text-xs py-2.5">Payer Name</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Top N Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                                        <TrendingUp className="size-3" />
                                        Top CPTs
                                    </Label>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg">{topN} Items</span>
                                </div>
                                <div className="pt-3 px-2">
                                    <Slider
                                        value={[topN]}
                                        min={5}
                                        max={30}
                                        step={1}
                                        onValueChange={(v) => setTopN(v[0])}
                                        className="py-2"
                                    />
                                    <div className="flex items-center justify-between mt-1 px-1">
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-40">5</span>
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-40">15</span>
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-40">30</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </header>

                <Tabs defaultValue="overview" className="w-full space-y-8">
                    <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-2xl h-14 w-full max-w-2xl backdrop-blur-md">
                        <TabsTrigger value="overview" className="rounded-xl gap-2 font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300 group">
                            <LayoutDashboard className="size-4 group-data-[state=active]:scale-110 transition-transform" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="drilldown" className="rounded-xl gap-2 font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300 group">
                            <Search className="size-4 group-data-[state=active]:scale-110 transition-transform" />
                            Drilldown
                        </TabsTrigger>
                        <TabsTrigger value="compare" className="rounded-xl gap-2 font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300 group">
                            <GitCompare className="size-4 group-data-[state=active]:scale-110 transition-transform" />
                            Compare
                        </TabsTrigger>
                        {/* <TabsTrigger value="forecasts" className="rounded-xl gap-2 font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300 group">
                            <ForecastIcon className="size-4 group-data-[state=active]:scale-110 transition-transform" />
                            Forecasts
                        </TabsTrigger> */}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-10 outline-none animate-in fade-in-50 duration-500">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <DashboardStatsCard
                                title="Total Charges"
                                value={kpiData ? `$${kpiData.total_charges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "..."}
                                icon={DollarSign}
                                trend={kpiData ? (kpiData.charges_change >= 0 ? 'up' : 'down') : undefined}
                                loading={isLoadingKPIs}
                            />
                            <DashboardStatsCard
                                title="Total Payments"
                                value={kpiData ? `$${kpiData.total_payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "..."}
                                icon={CreditCard}
                                trend={kpiData ? (kpiData.payments_change >= 0 ? 'up' : 'down') : undefined}
                                loading={isLoadingKPIs}
                            />
                            <DashboardStatsCard
                                title="Net"
                                value={kpiData ? `$${kpiData.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "..."}
                                icon={Target}
                                trend={kpiData ? (kpiData.net >= 0 ? 'up' : 'down') : undefined}
                                loading={isLoadingKPIs}
                            />
                            <DashboardStatsCard
                                title="Collection Rate"
                                value={kpiData ? `${(kpiData.collection_rate * 100).toFixed(2)}%` : "..."}
                                icon={Percent}
                                trend={kpiData ? (kpiData.efficiency >= 0 ? 'up' : 'down') : undefined}
                                loading={isLoadingKPIs}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <DashboardTrendChart data={timeSeriesData} loading={isLoadingTimeSeries} className="lg:col-span-7" />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <DashboardDoctorTotals
                                data={doctorTotalsData}
                                onBarClick={handleDoctorBarClick}
                                loading={isLoadingDoctorTotals}
                                className="lg:col-span-7"
                            />

                            <DashboardHeatmap
                                data={heatmapData}
                                matrix={heatmapMatrix}
                                departments={heatmapDepts}
                                onDoctorClick={handleDoctorBarClick}
                                onDepartmentClick={handleDepartmentClick}
                                onResetDoctor={() => setSelectedDoctor('all')}
                                loading={isLoadingHeatmap}
                                className="lg:col-span-7"
                            />
                        </div>

                        <DashboardLagChart data={lagData} loading={isLoadingLag} />

                        <div className="grid gap-6">
                            <DashboardPayerTrend
                                data={payerTrendData}
                                groups={payerGroups}
                                loading={isLoadingPayerTrend}
                            />
                        </div>

                        <div className="grid gap-6">
                            <DashboardCptMix data={cptMixApiData} loading={isLoadingCPT} />
                        </div>

                        <div className="grid gap-6">
                            <DashboardUnpaidCpt data={unpaidCptApiData} loading={isLoadingCPT} />
                        </div>

                        <div className="mt-6">
                            <DashboardUnallocated data={unallocatedData} loading={isLoadingCPT} />
                        </div>
                    </TabsContent>

                    <TabsContent value="drilldown" className="outline-none animate-in fade-in-50 duration-500">
                        <div className="grid gap-6">
                            <DashboardDepartmentBreakdown
                                data={drilldownDepartmentData}
                                selectedDoctor={selectedDoctor}
                                onDepartmentClick={handleDepartmentClick}
                                loading={isLoadingDrilldownDepts}
                            />

                            <DashboardCptBreakdown
                                data={drilldownCptData}
                                selectedDepartment={selectedDepartment}
                                loading={isLoadingDrilldownCPTs}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="compare" className="outline-none animate-in fade-in-50 duration-500">
                        <div className="grid gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-12">
                                <DashboardCompareKpis
                                    data={compareKpiData}
                                    loading={isLoadingCompare}
                                />
                            </div>

                            <DashboardCompareTrend
                                data={compareTrendPivoted}
                                config={compareTrendDynamicConfig}
                                loading={isLoadingCompare}
                                className="lg:col-span-12"
                            />

                            <DashboardCompareTotals
                                data={compareApiData?.totals || null}
                                onBarClick={handleDoctorBarClick}
                                loading={isLoadingCompare}
                                className="lg:col-span-12"
                            />

                            <DashboardHeatmap
                                title="Compare Departments Heatmap"
                                description="Side-by-side departmental revenue distribution"
                                data={null}
                                matrix={compareHeatmapMatrix}
                                departments={compareHeatmapDepts}
                                onDoctorClick={handleDoctorBarClick}
                                onDepartmentClick={handleDepartmentClick}
                                onResetDoctor={() => { }}
                                loading={isLoadingCompare}
                                className="lg:col-span-12"
                            />

                            <DashboardHeatmap
                                title="Compare CPT Heatmap"
                                description="Top CPT charges distribution between doctors"
                                data={null}
                                matrix={compareCptHeatmapMatrix}
                                departments={compareCptHeatmapCodes}
                                onDoctorClick={handleDoctorBarClick}
                                onDepartmentClick={() => { }}
                                onResetDoctor={() => { }}
                                loading={isLoadingCompare}
                                className="lg:col-span-12"
                            />

                            <DashboardCompareBar
                                title="Compare Payer Mix"
                                description="Payments by Payer Type"
                                data={comparePayerMixPivoted}
                                config={compareBarDynamicConfig}
                                dataKey="payer_type"
                                loading={isLoadingCompare}
                                formatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                className="lg:col-span-12"
                            />
                            <DashboardCompareBar
                                title="Compare CPT Mix Overlap"
                                description="% of total charges for top CPTs"
                                data={compareCptOverlapPivoted}
                                config={compareBarDynamicConfig}
                                dataKey="CPTCode"
                                loading={isLoadingCompare}
                                formatter={(v) => `${v.toFixed(1)}%`}
                                tooltip={<CptOverlapTooltip />}
                                className="lg:col-span-12"
                            />
                            <DashboardCompareBar
                                title="Compare Lag Distribution"
                                description="Wait times comparison"
                                data={compareLagPivoted}
                                config={compareBarDynamicConfig}
                                dataKey="bucket"
                                loading={isLoadingCompare}
                                className="lg:col-span-12"
                            />
                            <DashboardHeatmap
                                title="Compare Department Mix %"
                                description="% of doctor revenue per department"
                                data={null}
                                matrix={compareDeptMixMatrix}
                                departments={compareHeatmapDepts}
                                onDoctorClick={handleDoctorBarClick}
                                onDepartmentClick={handleDepartmentClick}
                                onResetDoctor={() => { }}
                                loading={isLoadingCompare}
                                className="lg:col-span-12"
                            />

                        </div>
                    </TabsContent>

                    {/* <TabsContent value="forecasts" className="outline-none animate-in fade-in-50 duration-500">
                        <div className="grid gap-6">
                            <DashboardForecastControls
                                frequency={forecastFrequency}
                                onFrequencyChange={setForecastFrequency}
                                horizon={forecastHorizon}
                                onHorizonChange={setForecastHorizon}
                                method={forecastMethod}
                                onMethodChange={setForecastMethod}
                            />

                            <DashboardOverallForecast data={overallForecastMetricPivoted} loading={isLoadingForecasts} />

                            <DashboardDepartmentForecast
                                title="Dept Forecast (Payments)"
                                description="Stacked payments forecast"
                                data={deptPaymentsForecast}
                                config={dynamicDeptForecastConfig}
                                groups={deptForecastGroups}
                                loading={isLoadingForecasts}
                            />

                            <DashboardDepartmentForecast
                                title="Dept Forecast (Charges)"
                                description="Stacked charges forecast"
                                data={deptChargesForecast}
                                config={dynamicDeptForecastConfig}
                                groups={deptForecastGroups}
                                loading={isLoadingForecasts}
                            />

                            <Card className="mt-6 rounded-[2rem] border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all duration-500">
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                            <Layers className="size-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-black uppercase tracking-wider text-xs text-muted-foreground/80">Payer Mix Assumptions</div>
                                            <div className="text-[10px] text-muted-foreground font-medium">Recent allocated positive payments</div>
                                        </div>
                                    </div>

                                    {overallForecast ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-sm font-bold mb-4 text-foreground/90 flex items-center gap-2">
                                                    <UsersIcon className="size-3.5 text-primary/70" />
                                                    Top Payer Weights
                                                </h4>
                                                <ul className="grid grid-cols-2 gap-2">
                                                    {Object.entries(overallForecast.meta?.payer_weights || {}).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([payer, weight]) => (
                                                        <li key={payer} className="text-xs font-medium flex justify-between items-center p-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                                                            <span className="text-muted-foreground truncate mr-2" title={payer}>{payer}</span>
                                                            <Badge variant="secondary" className="font-bold bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 shrink-0">
                                                                {(weight * 100).toFixed(1)}%
                                                            </Badge>
                                                        </li>
                                                    ))}
                                                    {Object.keys(overallForecast.meta?.payer_weights || {}).length === 0 && (
                                                        <li className="col-span-2 text-xs text-muted-foreground italic p-2">No payer mix available (fallback kernel used).</li>
                                                    )}
                                                </ul>
                                            </div>

                                            <div className="flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-bold mb-4 text-foreground/90 flex items-center gap-2">
                                                        <Activity className="size-3.5 text-primary/70" />
                                                        Key Forecast Metrics
                                                    </h4>
                                                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/10 space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-muted-foreground">Collection rate (allocated)</span>
                                                            <span className="text-sm font-black text-foreground">{((overallForecast.meta?.collection_rate_alloc || 0) * 100).toFixed(2)}%</span>
                                                        </div>
                                                        <div className="h-px bg-border/10 w-full" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-muted-foreground">Unallocated factor</span>
                                                            <span className="text-sm font-black text-foreground">{(overallForecast.meta?.unalloc_factor || 1.0).toFixed(2)}x</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-start gap-2 text-muted-foreground bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10">
                                                    <AlertCircle className="size-4 text-amber-500/80 mt-0.5 shrink-0" />
                                                    <p className="text-[10px] font-medium leading-relaxed italic opacity-80">
                                                        Payments = charges ⊗ lag-kernel(payer-mix) × collection-rate. This model projects revenue based on billings and collection history.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-muted-foreground italic">
                                            Loading forecast assumptions...
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent> */}
                </Tabs >
            </div >
        </div >
    )
}


