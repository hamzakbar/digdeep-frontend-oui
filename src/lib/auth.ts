export const auth = {
    isAuthenticated: async () => {
        try {
            const user = await verifyAuthFromBackend()
            if (user && user.canAccessDigDeep) {
                // SUCCESS: Store full user object and auth indicator
                localStorage.setItem('user_details', JSON.stringify(user))
                localStorage.setItem('access_token', 'verified')
                return true
            }
        } catch (error) {
            console.error('Critical auth error:', error)
        }

        // FAILURE or NULL or !canAccessDigDeep: Wipe storage completely
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_details')
        return false
    },

    getUser: async () => {
        const user = await verifyAuthFromBackend()
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
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_details')
    },
}

async function verifyAuthFromBackend(): Promise<Record<string, any> | null> {
    const apiUrl = import.meta.env.VITE_GRAPHQL_URL
    if (!apiUrl) {
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
        const response = await fetch(apiUrl, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        })

        if (!response.ok) {
            return null
        }

        const { data, errors } = await response.json()

        // Strict verification: me must be a valid object and no GraphQL errors present
        if (data && data.me && !errors) {
            return data.me
        }
    } catch (error) {
        console.error('Network or Parse error during auth check:', error)
    }

    return null
}
