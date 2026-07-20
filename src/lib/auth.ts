export interface AuthStatus {
    isAuthenticated: boolean
    hasAccess: boolean
    user?: Record<string, any> | null
}

export type AuthMethod = 'sso' | 'legacy'

/**
 * Which login options are available.
 *   'sso'    → Microsoft Entra SSO via the DigDeep backend only
 *   'legacy' → original treatmentgps.com cookie + GraphQL flow only
 *   'both'   → offer BOTH; each user's chosen method is remembered per session
 */
const RAW_MODE = import.meta.env.VITE_AUTH_MODE
export const AUTH_MODE: 'sso' | 'legacy' | 'both' =
    RAW_MODE === 'legacy' ? 'legacy' : RAW_MODE === 'both' ? 'both' : 'sso'

export const SSO_ENABLED = AUTH_MODE === 'sso' || AUTH_MODE === 'both'
export const LEGACY_ENABLED = AUTH_MODE === 'legacy' || AUTH_MODE === 'both'

// --- Endpoints -------------------------------------------------------------
const SSO_API_URL = import.meta.env.VITE_API_URL
// Legacy data calls go through the treatmentgps proxy. Falls back to VITE_API_URL
// if a dedicated legacy base isn't configured.
const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL || import.meta.env.VITE_API_URL
const LEGACY_GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL
const LEGACY_LOGIN_URL =
    import.meta.env.VITE_LEGACY_LOGIN_URL || 'https://treatmentgps.com/home/'

export const ssoLoginUrl = `${SSO_API_URL}/auth/microsoft/login`
export const legacyLoginUrl = LEGACY_LOGIN_URL

// --- Per-session method tracking ------------------------------------------
const METHOD_KEY = 'auth_method'

export function getAuthMethod(): AuthMethod | null {
    const m = localStorage.getItem(METHOD_KEY)
    return m === 'sso' || m === 'legacy' ? m : null
}

function setAuthMethod(m: AuthMethod) {
    localStorage.setItem(METHOD_KEY, m)
}

/** API base URL for the currently active auth method. Consumed by api.ts. */
export function getApiBase(): string {
    return getAuthMethod() === 'legacy' ? LEGACY_API_URL : SSO_API_URL
}

/** Record the chosen method, then redirect to that provider's login. */
export function startLogin(method: AuthMethod) {
    setAuthMethod(method)
    window.location.href = method === 'sso' ? ssoLoginUrl : legacyLoginUrl
}

// Legacy-only: profile sync runs once per load against the treatmentgps GraphQL.
let isProfileSynced = false

export const auth = {
    checkStatus: async (): Promise<AuthStatus> => {
        try {
            const user = await verifyActive()
            if (user) {
                const hasAccess = !!user.canAccessDigDeep
                if (hasAccess) {
                    localStorage.setItem('user_details', JSON.stringify(user))
                    localStorage.setItem('access_token', 'verified')

                    // Legacy flow only: keep the treatmentgps profile in sync
                    // (the SSO backend has no such mutation). Runs once per load.
                    if (getAuthMethod() === 'legacy' && !isProfileSynced) {
                        auth.updateUserProfile(user.firstName || '', user.lastName || '')
                            .then(success => {
                                if (success) {
                                    isProfileSynced = true
                                    console.log('User profile synchronized successfully')
                                }
                            })
                    }
                } else {
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('user_details')
                }
                return { isAuthenticated: true, hasAccess, user }
            }
        } catch (error) {
            console.error('Critical auth error:', error)
        }

        localStorage.removeItem('access_token')
        localStorage.removeItem('user_details')
        return { isAuthenticated: false, hasAccess: false, user: null }
    },

    isAuthenticated: async () => {
        const status = await auth.checkStatus()
        return status.isAuthenticated && status.hasAccess
    },

    // Legacy flow only: updates the user's profile via the treatmentgps GraphQL API.
    updateUserProfile: async (firstName: string, lastName: string): Promise<boolean> => {
        const apiUrl = import.meta.env.VITE_GRAPHQL_URL
        if (!apiUrl) {
            console.error('VITE_GRAPHQL_URL is missing')
            return false
        }

        const query = `
            mutation UserUpdate($params: UpdateUserInput!) {
              updateUserProfile(params: $params) {
                ...ResponseLogin
                __typename
              }
            }

            fragment ResponseLogin on MeRes {
              _id
              email
              firstName
              lastName
              middleName
              role
              phones
              organization {
                idOrg: _id
                name
                defaultTreatment {
                  idTreatment: _id
                  __typename
                }
                timezone {
                  offset
                  value
                  label
                  __typename
                }
                __typename
              }
              authenticationInfo {
                authenticationSource
                __typename
              }
              patient {
                idPatient: _id
                organization {
                  idOrg: _id
                  name
                  __typename
                }
                __typename
              }
              secondaryEmail {
                email
                isVerified
                __typename
              }
              setting {
                patientDashboard {
                  sort
                  __typename
                }
                analyticDashboard {
                  dateRange
                  __typename
                }
                homePage {
                  treatmentType
                  __typename
                }
                leftDrawer {
                  treatmentType
                  showInDrawer
                  __typename
                }
                perPage
                __typename
              }
              remoteUser {
                ...ResponseRemoteLogin
                __typename
              }
              __typename
            }

            fragment ResponseRemoteLogin on User {
              _id
              email
              firstName
              lastName
              middleName
              role
              phones
              organization {
                idOrg: _id
                name
                defaultTreatment {
                  idTreatment: _id
                  __typename
                }
                timezone {
                  value
                  offset
                  label
                  __typename
                }
                __typename
              }
              authenticationInfo {
                authenticationSource
                __typename
              }
              secondaryEmail {
                email
                isVerified
                __typename
              }
              setting {
                patientDashboard {
                  sort
                  __typename
                }
                analyticDashboard {
                  dateRange
                  __typename
                }
                homePage {
                  treatmentType
                  __typename
                }
                perPage
                __typename
              }
              __typename
            }
        `

        const variables = {
            params: {
                firstName: firstName,
                lastName: lastName,
                middleName: null
            }
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operationName: "UserUpdate",
                    variables,
                    query: query
                }),
            })

            if (!response.ok) {
                console.error('UserUpdate mutation failed')
                return false
            }

            const result = await response.json()
            return !result.errors
        } catch (error) {
            console.error('Network error during UserUpdate mutation:', error)
            return false
        }
    },

    getUser: async () => {
        const user = await verifyActive()
        if (user) {
            localStorage.setItem('user_details', JSON.stringify(user))
            return user
        }

        const storedUser = localStorage.getItem('user_details')
        if (storedUser) {
            try {
                return JSON.parse(storedUser)
            } catch {
                return null
            }
        }
        return null
    },

    logout: () => {
        const method = getAuthMethod()
        // Tear down the SSO server session (only relevant to the SSO method).
        if (method === 'sso' || (!method && SSO_ENABLED)) {
            try {
                fetch(`${SSO_API_URL}/auth/microsoft/logout`, {
                    method: 'POST',
                    credentials: 'include',
                }).catch(() => { })
            } catch {
                /* ignore */
            }
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_details')
        localStorage.removeItem(METHOD_KEY)
    },
}

/**
 * Verify the current session. If the method is known, use it. Otherwise (e.g.
 * a returning user whose flag was cleared) probe the enabled methods and latch
 * onto whichever has a valid session.
 */
async function verifyActive(): Promise<Record<string, any> | null> {
    const known = getAuthMethod()
    if (known === 'legacy') return verifyViaGraphQL()
    if (known === 'sso') return verifyViaBackendMe()

    // Unknown — probe enabled methods (SSO first).
    if (SSO_ENABLED) {
        const u = await verifyViaBackendMe()
        if (u) {
            setAuthMethod('sso')
            return u
        }
    }
    if (LEGACY_ENABLED) {
        const u = await verifyViaGraphQL()
        if (u) {
            setAuthMethod('legacy')
            return u
        }
    }
    return null
}

/** SSO: read the current user from the DigDeep backend's /me (session cookie). */
async function verifyViaBackendMe(): Promise<Record<string, any> | null> {
    if (!SSO_API_URL) {
        console.error('VITE_API_URL is missing in environment')
        return null
    }
    try {
        const response = await fetch(`${SSO_API_URL}/me`, {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        })
        if (!response.ok) return null
        const user = await response.json()
        if (user && user._id) return user
    } catch (error) {
        console.error('Network or Parse error during auth check:', error)
    }
    return null
}

/** Legacy: original treatmentgps.com GraphQL `me` query (cookie-based). */
async function verifyViaGraphQL(): Promise<Record<string, any> | null> {
    if (!LEGACY_GRAPHQL_URL) {
        console.error('VITE_GRAPHQL_URL is missing in environment')
        return null
    }

    const query = `
    query Me {
      me {
        _id
        email
        firstName
        lastName
        role
        canAccessDigDeep
        organization {
          idOrg: _id
          name
        }
      }
    }
  `

    try {
        const response = await fetch(LEGACY_GRAPHQL_URL, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        })
        if (!response.ok) return null
        const { data, errors } = await response.json()
        if (data && data.me && !errors) return data.me
    } catch (error) {
        console.error('Network or Parse error during auth check:', error)
    }
    return null
}
