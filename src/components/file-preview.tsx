import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
    ColumnDef,
    SortingState,
    VisibilityState,
    ColumnSizingState,
    CellContext,
} from '@tanstack/react-table'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table'
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    Download,
    Search,
    Loader2,
} from 'lucide-react'
import { getIconForFile } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { fetchFileContent } from '@/lib/api'
import Papa from 'papaparse'
import { MarkdownFormatter } from './markdown-formatter'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

const measureTextWidth = (text: string, font: string): number => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return 0
    context.font = font
    return context.measureText(text).width
}

interface FilePreviewProps {
    sessionId?: string
    shareToken?: string
    visitorId?: string
    selectedFile: string
    onClose?: () => void
    hideHeader?: boolean
}

export function FilePreview({
    sessionId,
    shareToken,
    visitorId,
    selectedFile,
    hideHeader,
}: FilePreviewProps) {
    const [imageUrl, setImageUrl] = useState<string>('')
    const [textContent, setTextContent] = useState<string>('')
    const [tableData, setTableData] = useState<Record<string, string | number>[]>([])
    const [tableColumns, setTableColumns] = useState<ColumnDef<Record<string, string | number>>[]>([])
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false)

    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

    const fileContentQuery = useQuery({
        queryKey: ['file-content', sessionId, shareToken, visitorId, selectedFile],
        queryFn: async () => {
            setImageUrl('')
            setTextContent('')
            setTableData([])
            setTableColumns([])
            setColumnSizing({})

            const res = await fetchFileContent(sessionId, shareToken, visitorId, selectedFile)
            const fileExtension = selectedFile.split('.').pop()?.toLowerCase()

            if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fileExtension || '')) {
                const blob = await res.blob()
                setImageUrl(URL.createObjectURL(blob))
            } else if (fileExtension === 'csv') {
                const text = await res.text()
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: Papa.ParseResult<Record<string, string | number>>) => {
                        const data = results.data as Record<string, string | number>[]
                        const headers = (results.meta.fields as string[]) || []

                        const newColumnSizing: ColumnSizingState = {}
                        const sample = data.slice(0, 50)
                        const PADDING = 80

                        headers.forEach((header: string) => {
                            const headerWidth = measureTextWidth(header, 'bold 14px sans-serif')
                            const maxCellWidth = Math.max(
                                ...sample.map((row) =>
                                    measureTextWidth(String(row[header] || ''), '14px sans-serif')
                                )
                            )
                            newColumnSizing[header] = Math.max(
                                120,
                                Math.min(500, Math.max(headerWidth, maxCellWidth) + PADDING)
                            )
                        })

                        const columns: ColumnDef<Record<string, string | number>>[] = headers.map(
                            (header: string) => ({
                                accessorKey: header,
                                header: header,
                                size: newColumnSizing[header],
                                cell: (info: CellContext<Record<string, string | number>, string | number>) =>
                                    info.getValue(),
                            })
                        )

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
        staleTime: 0,
        gcTime: 0,
    })

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
            columnSizing,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const tableContainerRef = useRef<HTMLDivElement>(null)
    const { rows } = table.getRowModel()
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 40,
        overscan: 10,
    })

    const handleDownload = async () => {
        try {
            const res = await fetchFileContent(sessionId, shareToken, visitorId, selectedFile)
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = selectedFile
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to download file:', error)
        }
    }

    if (fileContentQuery.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="size-8 text-primary animate-spin opacity-40" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading content...</p>
            </div>
        )
    }

    if (fileContentQuery.isError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="size-16 rounded-full bg-destructive/5 flex items-center justify-center mb-4">
                    <span className="text-destructive text-2xl font-bold">!</span>
                </div>
                <h3 className="text-lg font-bold">Failed to load content</h3>
                <p className="text-muted-foreground mt-1 max-w-xs">There was an error fetching the file content from the server.</p>
                <Button variant="outline" className="mt-6 rounded-xl" onClick={() => fileContentQuery.refetch()}>Retry</Button>
            </div>
        )
    }

    if (imageUrl) {
        return (
            <div className="h-full w-full flex flex-col">
                {!hideHeader && (
                    <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner", getIconForFile(selectedFile).bgColor)}>
                                {(() => {
                                    const { Icon, color } = getIconForFile(selectedFile)
                                    return <Icon className={cn("size-4", color)} />
                                })()}
                            </div>
                            <h2 className="font-bold text-sm truncate text-foreground/90">{selectedFile}</h2>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl h-8 text-[11px] font-bold shadow-sm" onClick={handleDownload}>
                            <Download className="size-3.5 mr-2" />
                            Download
                        </Button>
                    </div>
                )}
                <div className="flex-1 p-8 flex items-center justify-center bg-muted/30">
                    <img
                        src={imageUrl}
                        alt={selectedFile}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl shadow-primary/5 border cursor-zoom-in transition-transform hover:scale-[1.02]"
                    />
                </div>
            </div>
        )
    }

    if (tableData.length > 0) {
        return (
            <div className="h-full w-full flex flex-col bg-background overflow-hidden min-w-0">
                <div className="flex items-center gap-3 p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 shrink-0 w-full overflow-hidden">
                    <div className="relative flex-1 max-w-sm min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground shrink-0" />
                        <Input
                            placeholder="Filter records..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-9 h-9 rounded-xl border-border/60 text-xs shadow-none focus-visible:ring-primary/10 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <DropdownMenu open={isColumnDropdownOpen} onOpenChange={setIsColumnDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl h-9 text-[11px] font-bold border-border/60 shrink-0">
                                    Columns <ChevronDown className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[200px]">
                                <div className="flex items-center justify-between gap-2 p-2 border-b mb-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] px-2 font-bold hover:bg-primary/5 hover:text-primary transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            table.toggleAllColumnsVisible(true)
                                        }}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] px-2 font-bold hover:bg-destructive/5 hover:text-destructive transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            table.toggleAllColumnsVisible(false)
                                        }}
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                                    {table.getAllLeafColumns().map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize rounded-lg text-xs"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value: boolean) => column.toggleVisibility(!!value)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </div>
                                <div className="p-2 border-t mt-1">
                                    <Button
                                        className="w-full h-8 rounded-lg text-[11px] font-bold shadow-lg shadow-primary/20"
                                        onClick={() => setIsColumnDropdownOpen(false)}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-px h-6 bg-border/60 mx-1" />
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-9 text-[11px] font-bold border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all shrink-0 shadow-lg shadow-primary/5"
                            onClick={handleDownload}
                        >
                            <Download className="size-3.5 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-muted/10 p-4 md:p-8 flex flex-col min-w-0">
                    <div
                        ref={tableContainerRef}
                        className="flex-1 w-full min-w-0 max-w-full overflow-auto rounded-[2rem] border border-border/40 bg-background shadow-2xl shadow-primary/5"
                    >
                        <table
                            className="text-[13px] border-separate border-spacing-0 min-w-full"
                            style={{ width: table.getTotalSize() }}
                        >
                            <thead className="sticky top-0 z-10 bg-background text-foreground/80">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="flex">
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-4 h-12 text-left font-bold text-muted-foreground border-b border-r border-border/40 bg-muted/5 whitespace-nowrap group select-none flex items-center shrink-0 last:border-r-0"
                                                style={{ width: header.getSize() }}
                                            >
                                                <div
                                                    className="flex items-center justify-between gap-2 cursor-pointer w-full"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {{
                                                            asc: <ChevronUp className="size-3.5" />,
                                                            desc: <ChevronDown className="size-3.5" />,
                                                        }[header.column.getIsSorted() as string] ?? (
                                                                <ChevronsUpDown className="size-3.5 text-muted-foreground/30" />
                                                            )}
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="relative block" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                                {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                                    const row = rows[virtualRow.index]
                                    return (
                                        <tr
                                            key={row.id}
                                            className="absolute flex hover:bg-primary/[0.02] transition-colors bg-background w-full border-r border-border/40"
                                            style={{
                                                transform: `translateY(${virtualRow.start}px)`,
                                                height: `${virtualRow.size}px`,
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className="px-4 py-2 border-b border-r border-border/40 truncate text-foreground/80 font-medium flex items-center shrink-0 last:border-r-0"
                                                    style={{ width: cell.column.getSize() }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-2 border-t bg-background text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                    {rows.length} Total Records
                </div>
            </div>
        )
    }

    if (textContent) {
        if (selectedFile?.endsWith('.html')) {
            return (
                <div className="h-full w-full flex flex-col bg-background">
                    {!hideHeader && (
                        <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner", getIconForFile(selectedFile).bgColor)}>
                                    {(() => {
                                        const { Icon, color } = getIconForFile(selectedFile)
                                        return <Icon className={cn("size-4", color)} />
                                    })()}
                                </div>
                                <h2 className="font-bold text-sm truncate text-foreground/90">{selectedFile}</h2>
                            </div>
                            <Button size="sm" variant="outline" className="rounded-xl h-8 text-[11px] font-bold shadow-sm" onClick={handleDownload}>
                                <Download className="size-3.5 mr-2" />
                                Download
                            </Button>
                        </div>
                    )}
                    <iframe
                        srcDoc={textContent}
                        title={selectedFile}
                        className="w-full flex-1 border-none"
                        sandbox="allow-scripts"
                    />
                </div>
            )
        }

        return (
            <div className="h-full w-full flex flex-col bg-background">
                {!hideHeader && (
                    <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 leading-none">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner", getIconForFile(selectedFile).bgColor)}>
                                {(() => {
                                    const { Icon, color } = getIconForFile(selectedFile)
                                    return <Icon className={cn("size-4", color)} />
                                })()}
                            </div>
                            <h2 className="font-bold text-sm truncate text-foreground/90 leading-none">{selectedFile}</h2>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl h-8 text-[11px] font-bold shadow-sm" onClick={handleDownload}>
                            <Download className="size-3.5 mr-2" />
                            Download
                        </Button>
                    </div>
                )}
                <div className="flex-1 overflow-auto p-8 lg:p-12 w-full max-w-full bg-muted/5">
                    <MarkdownFormatter textContent={textContent} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center h-full text-muted-foreground font-medium italic">
            Select a file to view its content
        </div>
    )
}
