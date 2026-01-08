import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table'

interface MarkdownFormatterProps {
    textContent: string
    onLinkClick?: (href: string) => boolean
}

/**
 * Pre-processes markdown to fix frequent issues:
 * 1. Missing table separators (standard Markdown/GFM requires |---| below headers)
 * 2. Pipe-separated data blocks that aren't recognized as tables
 */
const preprocessMarkdown = (content: string) => {
    if (!content) return ''
    const lines = content.split('\n')
    const result: string[] = []
    let inTable = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const pipeCount = (line.match(/\|/g) || []).length
        const isSeparator = !!line.match(/^\|?[:\-\s|]+$/)

        if (pipeCount >= 2 && !isSeparator) {
            // Check if this is a potential table start missing a separator
            if (!inTable && i < lines.length - 1) {
                const nextLine = lines[i + 1].trim()
                const nextPipeCount = (nextLine.match(/\|/g) || []).length
                const nextIsSeparator = !!nextLine.match(/^\|?[:\-\s|]+$/)

                if (nextPipeCount >= 2 && !nextIsSeparator) {
                    result.push(lines[i])
                    const columns = line.split('|').length
                    const separator = Array(columns).fill('---').join('|')
                    result.push(`|${separator}|`)
                    inTable = true
                    continue
                }
            }
            inTable = true
        } else if (isSeparator) {
            inTable = true
        } else {
            inTable = false
        }

        result.push(lines[i])
    }

    return result.join('\n')
}

export const MarkdownFormatter = ({
    textContent,
    onLinkClick,
}: MarkdownFormatterProps) => {
    // Some models or manual files provide pipe-separated data without the MD separator row.
    // We pre-process to ensure these render as tables automatically.
    const processedContent = preprocessMarkdown(textContent)

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ node, ...props }) => (
                    <h1 className='text-3xl font-bold mt-6 mb-4' {...props} />
                ),
                h2: ({ node, ...props }) => (
                    <h2
                        className='text-2xl font-bold mt-5 mb-3 border-b pb-2'
                        {...props}
                    />
                ),
                h3: ({ node, ...props }) => (
                    <h3 className='text-xl font-semibold mt-4 mb-2' {...props} />
                ),
                p: ({ node, ...props }) => (
                    <p className='leading-7 [&:not(:first-child)]:mt-4' {...props} />
                ),
                ul: ({ node, ...props }) => (
                    <ul className='my-4 ml-6 list-disc [&>li]:mt-2' {...props} />
                ),
                ol: ({ node, ...props }) => (
                    <ol className='my-4 ml-6 list-decimal [&>li]:mt-2' {...props} />
                ),
                a: ({ node, ...props }) => (
                    <a
                        className='text-primary underline hover:opacity-80 transition-opacity cursor-pointer'
                        onClick={(e) => {
                            if (props.href && onLinkClick) {
                                const handled = onLinkClick(props.href)
                                if (handled) {
                                    e.preventDefault()
                                }
                            }
                        }}
                        {...props}
                    />
                ),
                table: ({ node, ...props }) => (
                    <div
                        className='my-6 w-full overflow-x-auto max-w-full border rounded-lg shadow-sm outline-none'
                        tabIndex={0}
                    >
                        <Table {...props} />
                    </div>
                ),
                thead: ({ node, ...props }) => <TableHeader {...props} />,
                tbody: ({ node, ...props }) => <TableBody {...props} />,
                tr: ({ node, ...props }) => <TableRow {...props} />,
                th: ({ node, ...props }) => <TableHead className='font-bold' {...props} />,
                td: ({ node, ...props }) => <TableCell {...props} />,
                pre: ({ node, ...props }) => (
                    <pre
                        className='my-4 overflow-x-auto rounded-lg bg-muted/50 p-4 outline-none'
                        tabIndex={0}
                        {...props}
                    />
                ),
            }}
        >
            {processedContent}
        </ReactMarkdown>
    )
}
