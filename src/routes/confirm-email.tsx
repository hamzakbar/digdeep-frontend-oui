import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { apiFetch } from '@/lib/api'

const confirmEmailSearchSchema = z.object({
  token: z.string().min(1, 'Token cannot be empty.'),
})

export const Route = createFileRoute('/confirm-email')({
  loader: async ({ context, location }) => {
    try {
      const searchParams = new URLSearchParams(location.search)
      const token = searchParams.get('token')
      const validationResult = confirmEmailSearchSchema.safeParse({ token })

      if (!validationResult.success) {
        throw new Error('A valid confirmation token is required.')
      }

      const validatedToken = validationResult.data.token
      const apiUrl = `/verify-email/${validatedToken}`
      const data = await apiFetch(apiUrl, { method: 'GET' })

      if (!data) {
        throw new Error('Received an empty response from the server.')
      }

      context.auth.setToken(data.access_token)
      context.auth.setUser(data.user)
    } catch (error) {
      console.error('Email confirmation flow ended:', error)

      if (
        error instanceof Error &&
        error.message.includes('User already verified')
      ) {
        throw redirect({
          to: '/',
          search: {
            toast: 'Your email is already verified. Please log in.',
            toastType: 'info',
          },
        })
      }
      
      throw redirect({
        to: '/',
        search: {
          toast:
            error instanceof Error
              ? error.message
              : 'Invalid or expired confirmation link.',
          toastType: 'error',
        },
      })
    }

    throw redirect({
      to: '/dashboard',
      search: {
        toast: 'Email successfully verified! Welcome.',
        toastType: 'success',
      },
    })
  },
})
