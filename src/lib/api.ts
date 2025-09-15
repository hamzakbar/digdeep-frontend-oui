import { auth } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

export interface Session {
    session_id: string
    name: string | null
    data_context?: string
}

export interface SessionsPage {
    data: Session[]
    total_count: number
    has_more: boolean
    page: number
    items_per_page: number
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = auth.getToken()
    const headers = new Headers(options.headers || {})

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
    }

    if (options.body instanceof FormData) {
        headers.delete('Content-Type')
    } else if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        cache: 'no-cache',
    })

    if (!response.ok) {
        if (response.status === 401) {
            auth.logout()
            window.location.href = '/'
        }

        let errorData

        try {
            errorData = await response.json()
        } catch {
            errorData = { message: response.statusText }
        }

        const message =
            errorData.detail && typeof errorData.detail === 'string'
                ? errorData.detail
                : errorData.message || 'An API error occurred'

        throw new Error(message)
    }

    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get('Content-Type')
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        return text ? JSON.parse(text) : null
    }

    return response
}

export const loginUser = (formData: URLSearchParams) =>
    apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
    })

export const signupUser = (data: Record<string, unknown>) =>
    apiFetch('/signup', { method: 'POST', body: JSON.stringify(data) })

export const verifyEmail = (token: string) => apiFetch(`/verify-email/${token}`)

export const fetchSessions = async ({
    pageParam = 1,
}: {
    pageParam?: number
}): Promise<SessionsPage> => {
    return apiFetch(`/session/user/sessions?page=${pageParam}&items_per_page=20`)
}

export const startSession = (data: {
    session_id: string
    name: string
    data_context: string
    model: string
}) => apiFetch('/session/start', { method: 'POST', body: JSON.stringify(data) })

export const fetchSessionById = (sessionId: string) =>
    apiFetch(`/session/${sessionId}`)

export const deleteSession = (sessionId: string) =>
    apiFetch(`/session/${sessionId}`, { method: 'DELETE' })

export const duplicateSession = (
    sessionId: string,
    newName: string,
    copyOptions: object
) =>
    apiFetch(`/session/${sessionId}/copy`, {
        method: 'POST',
        body: JSON.stringify({ new_name: newName, copy_options: copyOptions }),
    })

export const uploadSessionData = (sessionId: string, formData: FormData) =>
    apiFetch(`/session/files/${sessionId}`, {
        method: 'POST',
        body: formData,
    })

export const clarifySession = (
    sessionId: string,
    clarifications: Record<string, string>
) =>
    apiFetch(`/session/clarify/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ clarifications }),
    })

export const createCheckpoint = ({
    sessionId,
    label,
}: {
    sessionId: string
    label: string
}) =>
    apiFetch(
        `/session/checkpoint/${sessionId}/checkpoint?label=${encodeURIComponent(label)}`,
        { method: 'POST' }
    )

export const fetchCheckpoints = (sessionId: string) =>
    apiFetch(`/session/checkpoint/${sessionId}/checkpoints?page=1&items_per_page=50`)

export const activateCheckpoint = ({
    sessionId,
    checkpointId,
}: {
    sessionId: string
    checkpointId: string
}) =>
    apiFetch(
        `/session/checkpoint/${sessionId}/checkpoint/activate/${checkpointId}`,
        { method: 'POST' }
    )

export const deactivateCheckpoint = (sessionId: string) =>
    apiFetch(`/session/checkpoint/${sessionId}/checkpoint/deactivate`, {
        method: 'POST',
    })

export const deleteCheckpoint = (checkpointId: string) =>
    apiFetch(`/session/checkpoint/checkpoint/${checkpointId}`, {
        method: 'DELETE',
    })

export const generateGoals = ({
    sessionId,
    goal,
}: {
    sessionId: string
    goal: string
}) =>
    apiFetch(`/session/generate_tasks/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ task_goals: goal }),
    })

export const findUserByEmail = (email: string) =>
    apiFetch(`/user/email/${encodeURIComponent(email)}`)

export const shareSessionWithUser = (sessionId: string, userId: string) =>
    apiFetch(`/session/${sessionId}/share/user/${userId}`, { method: 'POST' })

export const createPublicShareLink = (
    sessionId: string,
    ttlDays: number,
    label?: string
) => {
    const params = new URLSearchParams({ ttl_days: ttlDays.toString() })
    if (label) {
        params.append('label', label)
    }
    return apiFetch(
        `/public/share/session/${sessionId}?${params.toString()}`,
        { method: 'POST' }
    )
}

export const fetchSharedLinks = (sessionId: string) =>
    apiFetch(`/files/session/${sessionId}/shares`)

export const deleteSharedLink = (linkId: number) =>
    apiFetch(`/files/share_links/${linkId}`, { method: 'DELETE' })

export const fetchSharedSessionInfo = (shareToken: string) =>
    apiFetch(`/public/${shareToken}`)

export const bootstrapSharedSession = (
    shareToken: string,
    visitorId: string
) =>
    apiFetch(`/public/${shareToken}/bootstrap`, {
        method: 'POST',
        headers: { 'X-Visitor-Id': visitorId },
        body: JSON.stringify({}),
    })

export const fetchFiles = (sessionId: string) =>
    apiFetch(`/session/${sessionId}/outputs`)

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

export const downloadSharedFile = async (fileId: string) => {
    const response = await apiFetch(`/files/shared_files/download/${fileId}`, {
        headers: { Accept: '*/*' },
    })

    const disposition = response.headers.get('content-disposition')
    let filename = 'downloaded-file'
    if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '')
        }
    }

    const blob = await response.blob()
    return { blob, filename }
}

async function _streamer(
    endpoint: string,
    body: object,
    onChunk: (chunk: string) => void,
    signal: AbortSignal,
    isSharedSession: boolean = false,
    visitorId?: string
) {
    const url = `${BASE_URL}${endpoint}`
    const token = auth.getToken()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }

    if (isSharedSession && visitorId) {
        headers['X-Visitor-Id'] = visitorId
    } else if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
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
    signal: AbortSignal,
    isSharedSession: boolean = false,
    visitorId?: string
) {
    const endpoint = isSharedSession
        ? `/public/${sessionId}/run`
        : `/session/run_task_v2/${sessionId}`

    const body = { task, log_iter: 3, red_report: false }

    await _streamer(endpoint, body, onChunk, signal, isSharedSession, visitorId)
}

export async function streamReportTask(
    sessionId: string,
    task: string,
    template: string | undefined,
    onChunk: (chunk: string) => void,
    signal: AbortSignal,
    isSharedSession: boolean = false,
    visitorId?: string
) {
    const endpoint = `/report/run_report_temp/${sessionId}`

    const body = {
        report_specs: task,
        html_template: template,
        log_iter: 2,
    }

    await _streamer(endpoint, body, onChunk, signal, isSharedSession, visitorId)
}