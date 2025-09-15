import type { ParsedBlock } from '@/lib/stream-parser'
import { MarkdownFormatter } from './markdown-formatter'

const ICONS: Record<string, string> = {
  started: '🚀',
  summary: '📝',
  finished: '✅',
  final: '🎉',
  Thought: '🧠',
  Action: '⚙️',
  Results: '✅',
  'Final Answer': '🏁',
  Summary: '🔍',
  Data: '📦',
}

export function ThoughtBlock({ parsed }: { parsed: ParsedBlock }) {
  return (
    <div className='pt-4 first:pt-0'>
      <div className='text-xs text-muted-foreground'>
        {ICONS[parsed.event] || '📦'} <strong>Event:</strong> {parsed.event}
      </div>

      {parsed.blocks.map((b, i) => (
        <div key={i} className='mt-3'>
          <div className='font-semibold'>
            {ICONS[b.label] || '📌'} {b.label}
          </div>
          <div className='text-sm ml-4 mt-1 whitespace-pre-wrap'>
            <div className='prose prose-sm dark:prose-invert max-w-none'>
              <MarkdownFormatter textContent={b.content} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
