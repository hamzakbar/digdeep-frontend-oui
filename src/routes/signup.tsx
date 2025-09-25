import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
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
import { signupUser } from '@/lib/api'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/signup')({
  beforeLoad: async ({ context }) => {
    const isAuthenticated = await context.auth.isAuthenticated();
    if (isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: SignupComponent,
})

function SignupComponent() {
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: signupUser,
    onSuccess: () => {
      toast.success('Confirmation email sent! Please check your inbox.')
      navigate({ to: '/' })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      mutate(value)
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
            <CardTitle className='text-2xl'>Create Account</CardTitle>
            <CardDescription>
              Enter your details to create a new account.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 my-6'>
            <form.Field
              name='name'
              validators={{
                onBlur: ({ value }) =>
                  !value ? 'Name is required' : undefined,
              }}
              children={(field) => (
                <div className='grid'>
                  <Label htmlFor={field.name}>Full Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='Your Name'
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
              name='email'
              validators={{
                onBlur: ({ value }) => {
                  if (!value) return 'Email is required'
                  if (
                    !String(value)
                      .toLowerCase()
                      .match(
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                      )
                  ) {
                    return 'Please enter a valid email'
                  }
                },
              }}
              children={(field) => (
                <div className='grid'>
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type='email'
                    placeholder='name@example.com'
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
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create Account
            </Button>
            <Separator className='mt-2' />
            <Button
              variant='link'
              type='button'
              onClick={() => navigate({ to: '/login' })}
            >
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
