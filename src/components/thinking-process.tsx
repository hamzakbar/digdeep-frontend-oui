import { useState, useEffect, useRef } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import type { ParsedBlock } from '@/lib/stream-parser'
import { MarkdownFormatter } from './markdown-formatter'
import { Loader2 } from 'lucide-react'

interface ThinkingProcessProps {
    thoughts: ParsedBlock[]
    isStreaming: boolean
    onLinkClick?: (href: string) => boolean
}

export function ThinkingProcess({
    thoughts,
    isStreaming,
    onLinkClick,
}: ThinkingProcessProps) {
    const [openValue, setOpenValue] = useState(
        isStreaming ? 'thought-process' : ''
    )
    const contentRef = useRef<HTMLDivElement>(null)

    const triggerText = isStreaming ? 'Thinking...' : 'Thought Process'

    // Auto-scroll to bottom as new thoughts arrive
    useEffect(() => {
        if (isStreaming && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
    }, [thoughts, isStreaming])

    // Handle auto-open and auto-close
    useEffect(() => {
        if (isStreaming) {
            setOpenValue('thought-process')
        } else {
            // Give a tiny delay for the user to see the last thought if needed,
            // or just close it immediately as requested.
            setOpenValue('')
        }
    }, [isStreaming])

    return (
        <div className="w-full">
            <Accordion
                type='single'
                collapsible
                className='w-full border-none'
                value={openValue}
                onValueChange={setOpenValue}
            >
                <AccordionItem value='thought-process' className='border-none'>
                    <AccordionTrigger className='py-2 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 hover:no-underline hover:text-primary transition-colors bg-muted/50 rounded-2xl'>
                        <div className="flex items-center gap-2">
                            {isStreaming && <Loader2 className="size-3 animate-spin" />}
                            {triggerText}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2">
                        <div
                            ref={contentRef}
                            className='pl-6 space-y-6 border-l-2 border-primary/10 ml-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent'
                        >
                            {thoughts.map((thought, i) => (
                                <div key={i} className="space-y-4">
                                    {thought.blocks.map((block, j) => (
                                        <div key={j} className="space-y-2">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-primary/40">
                                                {block.label}
                                            </div>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/70">
                                                <MarkdownFormatter
                                                    textContent={block.content}
                                                    onLinkClick={onLinkClick}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
