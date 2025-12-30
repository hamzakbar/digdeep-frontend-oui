import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/session/$sessionId/')({
    beforeLoad: ({ params }) => {
        throw redirect({
            to: '/session/$sessionId/chat',
            params: { sessionId: params.sessionId },
        })
    },
})
