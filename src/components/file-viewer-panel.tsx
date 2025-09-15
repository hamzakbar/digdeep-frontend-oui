import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
  GroupingState,
  ExpandedState,
  CellContext,
  ColumnSizingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Skeleton } from './ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  List,
  File,
  FileText,
  FileJson,
  FileCode,
  ImageIcon,
  Sheet,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ListTree,
} from 'lucide-react'
import { apiFetch, fetchFileContent } from '@/lib/api'
import Papa from 'papaparse'
import { MarkdownFormatter } from './markdown-formatter'

const measureTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 0
  context.font = font
  return context.measureText(text).width
}

const isNumeric = (value: string | number): boolean => {
  if (typeof value === 'number') return true
  if (typeof value !== 'string') return false
  return !isNaN(parseFloat(value)) && isFinite(Number(value))
}

interface FileMeta {
  name: string
}

interface FileViewerPanelProps {
  sessionId?: string
  shareToken?: string
  visitorId?: string
  selectedFile: string | null
  onFileSelect: (fileName: string | null) => void
}

const getFiles = async ({
  sessionId,
  shareToken,
  visitorId,
}: Omit<FileViewerPanelProps, 'selectedFile' | 'onFileSelect'>) => {
  let path
  if (shareToken && visitorId) {
    path = `/public/${shareToken}/files/${visitorId}`
  } else if (sessionId) {
    path = `/session/${sessionId}/outputs`
  } else {
    throw new Error('Session ID or Share Token must be provided.')
  }
  return apiFetch(path)
}

const getIconForFile = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return { Icon: ImageIcon, color: 'text-blue-500' }
    case 'md':
    case 'markdown':
      return { Icon: FileText, color: 'text-indigo-500' }
    case 'csv':
      return { Icon: Sheet, color: 'text-green-600' }
    case 'html':
      return { Icon: FileCode, color: 'text-orange-500' }
    case 'json':
      return { Icon: FileJson, color: 'text-yellow-500' }
    default:
      return { Icon: File, color: 'text-muted-foreground' }
  }
}

export function FileViewerPanel({
  sessionId,
  shareToken,
  visitorId,
  selectedFile,
  onFileSelect,
}: FileViewerPanelProps) {
  const [textContent, setTextContent] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [tableData, setTableData] = useState<Record<string, string | number>[]>([])
  const [tableColumns, setTableColumns] = useState<
    ColumnDef<Record<string, string | number>>[]
  >([])

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const queryKey = shareToken
    ? ['files', shareToken, visitorId]
    : ['files', sessionId]

  const filesQuery = useQuery({
    queryKey,
    queryFn: () => getFiles({ sessionId, shareToken, visitorId }),
    refetchInterval: 10000,
    enabled: !!(sessionId || (shareToken && visitorId)),
  })

  const fileContentQuery = useQuery({
    queryKey: [...queryKey, 'content', selectedFile],
    queryFn: async () => {
      if (!selectedFile) return null
      setImageUrl('')
      setTextContent('')
      setTableData([])
      setTableColumns([])
      setColumnSizing({})

      const res = await fetchFileContent(
        sessionId,
        shareToken,
        visitorId,
        selectedFile
      )
      const fileExtension = selectedFile.split('.').pop()?.toLowerCase()

      if (
        ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(
          fileExtension || ''
        )
      ) {
        const blob = await res.blob()
        setImageUrl(URL.createObjectURL(blob))
      } else if (fileExtension === 'csv') {
        const text = await res.text()
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as Record<string, string | number>[]
            const headers = (results.meta.fields as string[]) || []

            const newColumnSizing: ColumnSizingState = {}
            const sample = data.slice(0, 50)
            const PADDING = 80

            headers.forEach((header: string) => {
              const headerWidth = measureTextWidth(
                header,
                'bold 14px sans-serif'
              )
              const maxCellWidth = Math.max(
                ...sample.map((row) =>
                  measureTextWidth(row[header] || '', '14px sans-serif')
                )
              )
              newColumnSizing[header] = Math.max(
                120,
                Math.min(500, Math.max(headerWidth, maxCellWidth) + PADDING)
              )
            })

            const columns: ColumnDef<Record<string, string | number>>[] =
              headers.map((header: string) => ({
                accessorKey: header,
                header: header,
                size: newColumnSizing[header],
                cell: (
                  info: CellContext<
                    Record<string, string | number>,
                    string | number
                  >
                ) => info.getValue(),
                aggregationFn: isNumeric(data[0]?.[header]) ? 'sum' : undefined,
                aggregatedCell: (
                  info: CellContext<
                    Record<string, string | number>,
                    string | number
                  >
                ) => {
                  const value = info.getValue()
                  if (typeof value !== 'number') return null
                  return (
                    <div className='text-right font-bold pr-2'>
                      {value.toLocaleString()}
                    </div>
                  )
                },
              }))

            setColumnSizing(newColumnSizing)
            setTableColumns(columns)
            setTableData(data)
          },
        })
      } else {
        setTextContent(await res.text())
      }
      return true
    },
    enabled: !!selectedFile,
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (filesQuery.data?.files) {
      const files = filesQuery.data.files ?? []
      if (!selectedFile && files.length > 0) {
        onFileSelect(files[0].name)
      }
    }
  }, [filesQuery.data, selectedFile, onFileSelect])

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      grouping,
      expanded,
      columnSizing,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 10,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const renderContent = () => {
    if (fileContentQuery.isPending) {
      return (
        <div className='p-6 space-y-4 w-full'>
          <Skeleton className='h-8 w-1/2' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      )
    }
    if (fileContentQuery.isError)
      return (
        <p className='p-6 text-destructive'>Could not load file content.</p>
      )
    if (imageUrl)
      return (
        <div className='p-6 h-full w-full flex items-center justify-center'>
          <img
            src={imageUrl}
            alt={selectedFile || 'image'}
            className='max-w-full max-h-full object-contain'
          />
        </div>
      )

    if (tableData.length > 0) {
      return (
        <div className='h-full w-full flex flex-col p-4 gap-4'>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search all columns...'
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className='max-w-sm'
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='ml-auto'>
                  Columns <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {table
                  .getAllLeafColumns()
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {grouping.length > 0 && (
              <Button variant='ghost' onClick={() => setGrouping([])}>
                Clear Grouping
              </Button>
            )}
          </div>

          <div
            ref={tableContainerRef}
            className='flex-1 overflow-auto rounded-md border'
          >
            <table className='grid text-sm' style={{ tableLayout: 'fixed' }}>
              <thead className='grid sticky top-0 bg-muted z-10'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className='flex w-full'>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className='flex items-center p-2 text-left font-bold border-b border-r border-border'
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div className='flex items-center justify-between w-full'>
                            <div
                              className={`flex items-center gap-2 min-w-0 mr-2 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {header.column.getCanSort() &&
                                ({
                                  asc: <ChevronUp className='h-4 w-4' />,
                                  desc: (
                                    <ChevronDown className='h-4 w-4' />
                                  ),
                                }[header.column.getIsSorted() as string] ?? (
                                  <ChevronsUpDown className='h-4 w-4 opacity-30 shrink-0' />
                                ))}
                              <span className='whitespace-nowrap'>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                            </div>
                            {header.column.getCanGroup() && (
                              <Button
                                size='sm'
                                variant={
                                  header.column.getIsGrouped()
                                    ? 'secondary'
                                    : 'ghost'
                                }
                                onClick={(e) => {
                                  e.stopPropagation()
                                  header.column.toggleGrouping()
                                }}
                                className='h-6 w-6 p-1 shrink-0'
                                title='Group by this column'
                              >
                                <ListTree className='h-4 w-4' />
                              </Button>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody
                className='grid relative'
                style={{ height: `${totalSize}px` }}
              >
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <tr
                      key={row.id}
                      className='flex w-full absolute'
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className='flex items-center p-2 border-b border-r border-border/50'
                          style={{ width: cell.column.getSize() }}
                        >
                          {cell.getIsGrouped() ? (
                            <button
                              className='flex items-center w-full min-w-0 gap-1 font-bold text-left'
                              onClick={row.getToggleExpandedHandler()}
                            >
                              {row.getIsExpanded() ? (
                                <ChevronDown className='shrink-0' />
                              ) : (
                                <ChevronRight className='shrink-0' />
                              )}
                              <span className='truncate'>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </span>
                              <span className='ml-auto shrink-0'>
                                ({row.subRows.length})
                              </span>
                            </button>
                          ) : cell.getIsAggregated() ? (
                            flexRender(
                              cell.column.columnDef.aggregatedCell ?? null,
                              cell.getContext()
                            )
                          ) : (
                            <span className='truncate'>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (textContent) {
      if (selectedFile?.endsWith('.html'))
        return (
          <iframe
            srcDoc={textContent}
            title={selectedFile}
            className='w-full h-full border-none'
            sandbox='allow-scripts'
          />
        )

      return (
        <div className='prose dark:prose-invert max-w-none h-full overflow-y-auto w-full p-6'>
          <MarkdownFormatter textContent={textContent} />
        </div>
      )
    }

    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>
          Select a file to view its content
        </p>
      </div>
    )
  }

  return (
    <ResizablePanelGroup
      direction='horizontal'
      className='h-full border rounded-2xl'
    >
      <ResizablePanel
        defaultSize={25}
        minSize={15}
        className='p-4 bg-muted/20 flex flex-col'
      >
        <h3 className='font-semibold mb-4 flex items-center gap-2 shrink-0'>
          <List className='h-4 w-4' /> Files
        </h3>
        <div className='flex-1 overflow-y-auto'>
          {filesQuery.isPending ? (
            <div className='space-y-2'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
            </div>
          ) : filesQuery.isError ? (
            <p className='text-destructive text-sm'>
              {filesQuery.error.message}
            </p>
          ) : (filesQuery.data?.files?.length ?? 0) === 0 ? (
            <p className='text-muted-foreground text-sm text-center pt-4'>
              No files found.
            </p>
          ) : (
            <ul className='space-y-1'>
              {filesQuery.data.files.map((file: FileMeta) => {
                const { Icon, color } = getIconForFile(file.name)
                return (
                  <li key={file.name}>
                    <button
                      onClick={() => onFileSelect(file.name)}
                      className={`w-full text-left text-sm p-2 rounded-md flex items-center gap-2 transition-colors ${selectedFile === file.name ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent'}`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${selectedFile === file.name ? '' : color}`}
                      />
                      <span className='truncate'>{file.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={75}
        minSize={30}
        className='flex flex-col bg-background'
      >
        {selectedFile ? (
          <main className='flex-1 overflow-auto'>{renderContent()}</main>
        ) : (
          <div className='flex-1 flex items-center justify-center'>
            <p className='text-muted-foreground'>
              No files available to display
            </p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}