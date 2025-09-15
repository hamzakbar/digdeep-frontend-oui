import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from './ui/scroll-area'

interface CsvViewerProps {
  data: string[][]
}

export function CsvViewer({ data }: CsvViewerProps) {
  if (data.length === 0) {
    return <p className='text-muted-foreground'>No data to display.</p>
  }

  const headers = data[0]
  const rows = data.slice(1)

  return (
    <ScrollArea className='h-full w-full border rounded-md'>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}