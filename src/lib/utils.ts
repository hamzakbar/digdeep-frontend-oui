import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ParsedBlock = {
  event: string
  blocks: { label: string; content: string }[]
}

export function parseEventStream(raw: string): ParsedBlock[] {
  // 1) split on each “event:” boundary
  const chunks = raw
    .split(/(?=^event:)/m)
    .map((c) => c.trim())
    .filter(Boolean)

  const results: ParsedBlock[] = []

  for (const chunk of chunks) {
    // 2) identify the event type
    const eventMatch = /^event:\s*(\w+)/i.exec(chunk)
    if (!eventMatch) continue
    const event = eventMatch[1].toLowerCase()

    // 3) gather all the data: lines into one string
    const dataText = chunk
      .split('\n')
      .filter((l) => /^data:/i.test(l) || /^[\sA-Za-z]/.test(l))
      .map((l) => l.replace(/^data:\s*/i, '').trim())
      .join(' ')
      .replace(/\s*Summary:\s*/gi, '') // strip stray “Summary:”
      .trim()

    // 4) standard block‐splitting for Thought / Action / Results / Final Answer
    const labels = ['Thought', 'Action', 'Results', 'Final Answer']
    const blocks: { label: string; content: string }[] = []
    let cursor = 0

    while (cursor < dataText.length) {
      // find the next label occurrence
      const next = labels
        .map((lbl) => {
          const idx = dataText
            .toLowerCase()
            .indexOf(lbl.toLowerCase() + ':', cursor)
          return idx >= 0 ? { lbl, idx } : null
        })
        .filter(Boolean)
        .sort((a, b) => a!.idx - b!.idx)[0]

      if (!next) {
        // no more labels → remainder is a generic summary
        const rem = dataText.slice(cursor).trim()
        if (rem) {
          blocks.push({
            label: event === 'final' ? 'Final Answer' : 'Summary',
            content: rem,
          })
        }
        break
      }

      const { lbl, idx } = next!
      const start = idx + lbl.length + 1 // skip “Label:”
      const nextLabelPos = labels
        .map((other) => {
          const pos = dataText
            .toLowerCase()
            .indexOf(other.toLowerCase() + ':', start)
          return pos >= 0 ? pos : Infinity
        })
        .reduce((min, p) => Math.min(min, p), Infinity)

      const content = dataText.slice(start, nextLabelPos).trim()
      blocks.push({ label: lbl, content })
      cursor = nextLabelPos
    }

    // 5) if nothing matched, fallback to a single Summary
    if (blocks.length === 0 && dataText) {
      blocks.push({
        label: event === 'final' ? 'Final Answer' : 'Summary',
        content: dataText,
      })
    }

    // 6) SPECIAL HANDLING FOR final EVENT
    if (event === 'final') {
      // combine all existing final‐answer text
      const full = blocks.map((b) => b.content).join(' ').trim()
      // strip leading “[Final Answer]:” if present
      const jsonLike = full.replace(/^\[?Final Answer\]?:?\s*/i, '')

      // pull out the summary field value
      const summaryMatch =
        /['"]summary['"]\s*:\s*['"]([^'"]+)['"]/i.exec(jsonLike)
      const summaryText = summaryMatch ? summaryMatch[1] : ''

      // remove the summary property from the rest
      const detailsOnly = jsonLike
        .replace(/,\s*['"]summary['"]\s*:\s*['"][^'"]+['"]\s*}/i, '}')
        .trim()

      // emit Details + Conclusion blocks
      const finalBlocks: { label: string; content: string }[] = []
      if (detailsOnly) {
        finalBlocks.push({
          label: 'Details',
          content: detailsOnly,
        })
      }
      if (summaryText) {
        finalBlocks.push({
          label: 'Conclusion',
          content: summaryText,
        })
      }

      results.push({ event, blocks: finalBlocks })
    } else {
      // normal events
      results.push({ event, blocks })
    }
  }

  return results
}
