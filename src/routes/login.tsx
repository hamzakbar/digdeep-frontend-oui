import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginUser } from '@/lib/api'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    // Check if user is already authenticated via cookies
    if (context.auth.isAuthenticated()) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = useNavigate()
  const { auth: authContext } = Route.useRouteContext()

  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      authContext.setToken(data.access_token)
      authContext.setUser(data.user_details)
      toast.success('Login successful!')
      navigate({ to: '/dashboard' })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },

    onSubmit: async ({ value }) => {
      const params = new URLSearchParams()
      params.append('grant_type', 'password')
      params.append('username', value.username)
      params.append('password', value.password)
      params.append('scope', '')
      params.append('client_id', '')
      params.append('client_secret', '')
      mutate(params)
    },
  })

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Card className='w-full max-w-sm'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <CardHeader>
            <CardTitle className='text-2xl'>Login</CardTitle>
            <CardDescription>
              Enter your username below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 my-6'>
            <form.Field
              name='username'
              validators={{
                onBlur: ({ value }) =>
                  !value ? 'Username is required' : undefined,
              }}
              children={(field) => (
                <div className='grid'>
                  <Label htmlFor={field.name}>Username</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='yourusername'
                  />
                  {field.state.meta.errors.length > 0 && (
                    <em className='text-destructive text-sm'>
                      {field.state.meta.errors.join(', ')}
                    </em>
                  )}
                </div>
              )}
            />
            <form.Field
              name='password'
              validators={{
                onBlur: ({ value }) =>
                  !value ? 'Password is required' : undefined,
              }}
              children={(field) => (
                <div className='grid'>
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type='password'
                  />
                  {field.state.meta.errors.length > 0 && (
                    <em className='text-destructive text-sm'>
                      {field.state.meta.errors.join(', ')}
                    </em>
                  )}
                </div>
              )}
            />
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              Sign in
            </Button>
            <Separator className='mt-2' />
            <Button
              variant='link'
              type='button'
              onClick={() => navigate({ to: '/signup' })}
            >
              Create a new user
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
