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
}: {
    pageParam?: number
} = {}): Promise<SessionsPage> => {
    const result = await apiFetch(`/session/user/sessions?page=${pageParam}&items_per_page=20`)

    // Normalize: If the API returns { sessions: [] } instead of { data: [] }
    if (result && result.sessions && !result.data) {
        return {
            data: result.sessions,
            total_count: result.sessions.length,
            has_more: false,
            page: 1,
            items_per_page: result.sessions.length,
        }
    }

    return result
}

export const startSession = ({ name }: { name: string }): Promise<Session> => {
    return apiFetch('/session/start', {
        method: 'POST',
        body: JSON.stringify({ name }),
    })
}

export const fetchSession = async (sessionId: string): Promise<Session> => {
    return apiFetch(`/session/${sessionId}`)
}

export interface SessionAsset {
    name: string
    size: number
    fmt: string
    download_url?: string
}

export const fetchFiles = async (sessionId: string): Promise<SessionAsset[]> => {
    const result = await apiFetch(`/session/${sessionId}/outputs`)
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
