import { auth } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL

export interface Session {
    session_id: string
    name: string | null
    data_context?: string
    created_at?: string
}

export interface SessionsPage {
    data: Session[]
    total_count: number
    has_more: boolean
    page: number
    items_per_page: number
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {})

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
    }

    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
    })

    if (!response.ok) {
        if (response.status === 401) {
            auth.logout()
            if (typeof window !== 'undefined') {
                window.location.href = '/'
            }
        }

        let errorData
        try {
            errorData = await response.json()
        } catch {
            errorData = { message: response.statusText }
        }

        throw new Error(errorData.detail || errorData.message || 'An API error occurred')
    }

    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get('Content-Type')
    if (contentType && contentType.includes('application/json')) {
        return response.json()
    }

    return response
}

export const fetchSessions = async ({
    pageParam = 1,
    itemsPerPage = 50,
}: {
    pageParam?: number
    itemsPerPage?: number
} = {}): Promise<SessionsPage> => {
    let userId = ''
    try {
        const userDetails = localStorage.getItem('user_details')
        if (userDetails) {
            const user = JSON.parse(userDetails)
            userId = user._id
        }
    } catch (error) {
        console.error('Error retrieving user ID:', error)
    }

    const result = await apiFetch(`/session/user/${userId}?page=${pageParam}&items_per_page=${itemsPerPage}`)

    // Normalize: If the API returns { sessions: [] } instead of { data: [] }
    if (result && result.sessions && !result.data) {
        return {
            data: result.sessions,
            total_count: result.sessions.length,
            has_more: false,
            page: pageParam,
            items_per_page: itemsPerPage,
        }
    }

    return result
}

export const startSession = ({ name, mode = 'fast' }: { name: string, mode?: 'slow' | 'fast' }): Promise<Session> => {
    return apiFetch('/session/start', {
        method: 'POST',
        body: JSON.stringify({ name, mode }),
    })
}

export const fetchSession = async (sessionId: string): Promise<Session> => {
    return apiFetch(`/session/${sessionId}`)
}

export const deleteSession = async (sessionId: string): Promise<void> => {
    return apiFetch(`/session/${sessionId}`, {
        method: 'DELETE',
    })
}

export interface OrgUser {
    user_id: string
    email: string
    organization_id: string
}

export const fetchOrgUsers = async (orgId: string, email?: string): Promise<{ users: OrgUser[] }> => {
    const query = email ? `?email=${encodeURIComponent(email)}` : ''
    return apiFetch(`/session/organization/${orgId}${query}`)
}

export const shareSessionWithUsers = async (sessionId: string, userIds: string[]): Promise<{ status: string; message: string }> => {
    return apiFetch(`/session/${sessionId}/share/users`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds }),
    })
}

export interface SessionAsset {
    name: string
    size: number
    fmt: string
    download_url?: string
}

export const fetchFiles = async (sessionId: string): Promise<SessionAsset[]> => {
    const result = await apiFetch(`/session/${sessionId}/outputs`)
    if (Array.isArray(result)) {
        return result
    }
    return result?.files || []
}

export const fetchFileContent = async (
    sessionId: string | undefined,
    shareToken: string | undefined,
    visitorId: string | undefined,
    fileName: string
) => {
    let path = ''
    if (shareToken && visitorId) {
        path = `/public/${shareToken}/files/${visitorId}/${encodeURIComponent(
            fileName
        )}`
    } else if (sessionId) {
        path = `/session/${sessionId}/outputs/${encodeURIComponent(fileName)}`
    } else {
        throw new Error('Session ID or Share Token must be provided.')
    }
    return apiFetch(path, { headers: { Accept: '*/*' } })
}

async function _streamer(
    endpoint: string,
    body: object,
    onChunk: (chunk: string) => void,
    signal: AbortSignal
) {
    const url = `${import.meta.env.VITE_API_URL}${endpoint}`
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
        credentials: 'include'
    })

    if (!response.body) throw new Error('No response body for streaming')
    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Streaming task failed')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        onChunk(decoder.decode(value, { stream: true }))
    }
}

export async function streamTask(
    sessionId: string,
    task: string,
    onChunk: (chunk: string) => void,
    signal: AbortSignal
) {
    const endpoint = `/session/run_task_v2/${sessionId}`
    const body = { task, log_iter: 3, red_report: false }
    await _streamer(endpoint, body, onChunk, signal)
}

export interface DashboardFilter {
    start_date?: string
    end_date?: string
    date_basis?: string
    doctor_ids?: number[]
    department_ids?: number[]
    facility_ids?: number[]
    payer_groupby?: string
    top_n?: number
}

export interface KPIData {
    total_charges: number
    charges_change: number
    total_payments: number
    payments_change: number
    net: number
    collection_rate: number
    efficiency: number
}

export const fetchKPIs = async (filters: DashboardFilter): Promise<KPIData> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/kpis?${params.toString()}`)
    return result.kpis || result
}

export interface TimeSeriesPoint {
    date: string
    charges: number
    payments: number
}

export interface DoctorTimeSeriesData {
    series: TimeSeriesPoint[]
}

export const fetchDoctorTimeSeries = async (filters: DashboardFilter): Promise<TimeSeriesPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/doctor-timeseries?${params.toString()}`)
    return result.series || []
}

export interface DoctorTotal {
    doctor_id: number
    doctor: string
    charges: number
    payments: number
}

export const fetchDoctorTotals = async (filters: DashboardFilter): Promise<DoctorTotal[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/doctor-totals?${params.toString()}`)
    return result.totals || []
}

export interface LagPoint {
    bucket: string
    count: number
}

export const fetchPaymentLag = async (filters: DashboardFilter): Promise<LagPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    const result = await apiFetch(`/bi/payment-lag?${params.toString()}`)
    return result.buckets || []
}

export interface PayerTrendPoint {
    date: string
    payments: number
    payer_group: string
}

export const fetchPayerTrend = async (filters: DashboardFilter): Promise<PayerTrendPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.payer_groupby) params.append('group_by', filters.payer_groupby)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/payer-trend?${params.toString()}`)
    return result.series || []
}

export interface CPTMixPoint {
    CPTCode: string
    charges: number
    ProcedureDescription: string
    volume: number
    payments: number
}

export const fetchCPTMix = async (filters: DashboardFilter): Promise<CPTMixPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.top_n) params.append('top_n', filters.top_n.toString())
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/cpt-mix?${params.toString()}`)
    return result.cpts || []
}

export interface UnpaidCPTPoint {
    CPTCode: string
    unpaid: number
    ProcedureDescription: string
    charges: number
    payments: number
}

export const fetchUnpaidCPT = async (filters: DashboardFilter): Promise<UnpaidCPTPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.top_n) params.append('top_n', filters.top_n.toString())
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/unpaid-cpt?${params.toString()}`)
    return result.rows || []
}

export interface UnallocatedSummary {
    unallocated_payments: number
    percent_unallocated: number
    total_payments: number
}

export const fetchUnallocatedPayments = async (filters: DashboardFilter): Promise<UnallocatedSummary> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/unallocated-payments?${params.toString()}`)
    return result.summary
}

export interface HeatmapPoint {
    doctor: string
    department: string
    charges: number
}

export const fetchHeatmap = async (filters: DashboardFilter): Promise<HeatmapPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/doctor-department-heatmap?${params.toString()}`)
    return result.matrix || result.rows || []
}

export const fetchPayerSummary = async (filters: DashboardFilter): Promise<any> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    return apiFetch(`/bi/payer-summary?${params.toString()}`)
}

export interface DoctorDepartmentPoint {
    department_id: number
    department_name: string
    charges: number
    payments: number
}

export const fetchDoctorDepartments = async (filters: DashboardFilter): Promise<DoctorDepartmentPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/doctor-departments?${params.toString()}`)
    return result.departments || []
}

export interface DoctorDepartmentCPTPoint {
    CPTCode: string
    charges: number
    payments: number
    ProcedureDescription: string
}

export const fetchDoctorDepartmentCPTs = async (filters: DashboardFilter): Promise<DoctorDepartmentCPTPoint[]> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/doctor-department-cpts?${params.toString()}`)
    return result.cpts || []
}

export interface LookupItem {
    id: number
    name: string
}

export interface Lookups {
    doctors: LookupItem[]
    departments: LookupItem[]
    facilities: LookupItem[]
}

export const fetchLookups = async (): Promise<Lookups> => {
    const result = await apiFetch('/bi/lookups')
    return result
}

export interface DoctorCompareSeriesPoint {
    date: string
    doctor: string
    charges: number
    payments: number
}

export interface DoctorCompareTotalPoint {
    doctor: string
    charges: number
    payments: number
}

export interface DoctorCompareDeptPoint {
    department_name: string
    charges: number
    payments: number
}

export interface DoctorCompareData {
    series: DoctorCompareSeriesPoint[]
    totals: DoctorCompareTotalPoint[]
    departments: Record<string, DoctorCompareDeptPoint[]>
}

export const fetchDoctorCompare = async (filters: DashboardFilter): Promise<DoctorCompareData> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/doctor-compare?${params.toString()}`)
    return result
}

export interface OverallForecastPoint {
    date: string
    metric: string
    actual: number | null
    forecast: number | null
}

export interface DepartmentForecastPoint {
    date: string
    department: string
    metric: string
    forecast: number | null
}

export interface ForecastData {
    rows: any[]
    meta?: {
        payer_weights?: Record<string, number>
        collection_rate_alloc?: number
        unalloc_factor?: number
    }
}

export const fetchOverallForecast = async (filters: DashboardFilter & { freq: string, horizon: number, charges_method: string }): Promise<ForecastData> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.freq) params.append('freq', filters.freq)
    if (filters.horizon) params.append('horizon', filters.horizon.toString())
    if (filters.charges_method) params.append('charges_method', filters.charges_method)
    if (filters.payer_groupby) params.append('payer_groupby', filters.payer_groupby)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/overall-forecast?${params.toString()}`)
    return result
}

export const fetchDeptForecast = async (filters: DashboardFilter & { freq: string, horizon: number, charges_method: string }): Promise<ForecastData> => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.freq) params.append('freq', filters.freq)
    if (filters.horizon) params.append('horizon', filters.horizon.toString())
    if (filters.charges_method) params.append('charges_method', filters.charges_method)
    if (filters.payer_groupby) params.append('payer_groupby', filters.payer_groupby)
    filters.doctor_ids?.forEach(id => params.append('doctor_ids', id.toString()))
    filters.department_ids?.forEach(id => params.append('department_ids', id.toString()))
    filters.facility_ids?.forEach(id => params.append('facility_ids', id.toString()))

    const result = await apiFetch(`/bi/department-forecast?${params.toString()}`)
    return result
}
