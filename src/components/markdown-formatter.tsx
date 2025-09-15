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
}

export const MarkdownFormatter = ({ textContent }: MarkdownFormatterProps) => {
  return (
    <ReactMarkdown
      children={textContent}
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ ...props }) => (
          <h1 className='text-3xl font-bold mt-6 mb-4' {...props} />
        ),
        h2: ({ ...props }) => (
          <h2
            className='text-2xl font-bold mt-5 mb-3 border-b pb-2'
            {...props}
          />
        ),
        h3: ({ ...props }) => (
          <h3 className='text-xl font-semibold mt-4 mb-2' {...props} />
        ),
        p: ({ ...props }) => (
          <p className='leading-7 [&:not(:first-child)]:mt-4' {...props} />
        ),
        ul: ({ ...props }) => (
          <ul className='my-4 ml-6 list-disc [&>li]:mt-2' {...props} />
        ),
        ol: ({ ...props }) => (
          <ol className='my-4 ml-6 list-decimal [&>li]:mt-2' {...props} />
        ),
        a: ({ ...props }) => (
          <a className='text-primary underline' {...props} />
        ),
        table: ({ ...props }) => (
          <div className='my-6 w-full overflow-y-auto'>
            <Table {...props} />
          </div>
        ),
        thead: ({ ...props }) => <TableHeader {...props} />,
        tbody: ({ ...props }) => <TableBody {...props} />,
        tr: ({ ...props }) => <TableRow {...props} />,
        th: ({ ...props }) => <TableHead className='font-bold' {...props} />,
        td: ({ ...props }) => <TableCell {...props} />,
      }}
    />
  )
}
