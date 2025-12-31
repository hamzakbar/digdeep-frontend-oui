import {
    File,
    FileText,
    FileJson,
    FileCode,
    ImageIcon,
    Sheet,
} from 'lucide-react'

export const getIconForFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()

    switch (extension) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
            return { Icon: ImageIcon, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }
        case 'md':
        case 'markdown':
        case 'txt':
            return { Icon: FileText, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' }
        case 'csv':
        case 'xlsx':
        case 'xls':
            return { Icon: Sheet, color: 'text-green-600', bgColor: 'bg-green-600/10' }
        case 'html':
            return { Icon: FileCode, color: 'text-orange-500', bgColor: 'bg-orange-500/10' }
        case 'json':
            return { Icon: FileJson, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' }
        default:
            return { Icon: File, color: 'text-muted-foreground', bgColor: 'bg-muted/10' }
    }
}
