import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/session/$sessionId/chat')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/session/$sessionId/chat"!</div>
}
