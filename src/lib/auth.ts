import { redirect } from '@tanstack/react-router'

export const auth = {
  isAuthenticated: () => !!localStorage.getItem('access_token'),

  getToken: () => localStorage.getItem('access_token'),

  setToken: (token: string) => {
    localStorage.setItem('access_token', token)
  },

  getUser: () => {
    const user = localStorage.getItem('user_details')
    return user ? JSON.parse(user) : null
  },

  setUser: (user: Record<string, unknown>) => {
    localStorage.setItem('user_details', JSON.stringify(user))
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_details')
  },
}

interface AuthContext {
  auth: typeof auth
}

export const authGuard = ({ context, location }: { context: AuthContext; location: Location }) => {
  if (!context.auth.isAuthenticated()) {
    throw redirect({
      to: '/',
      search: {
        redirect: location.href,
      },
    })
  }
}