import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import templatesData from '@/lib/templates.json'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (templateHtml: string) => void
}

export function TemplateDialog({
  open,
  onOpenChange,
  onSelect,
}: TemplateDialogProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const templates = templatesData.templates
  const selectedTemplate = templates[selectedIdx]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='overflow-hidden p-0 md:max-h-[800px] md:max-w-[1100px] lg:max-w-[1200px]'>
        <DialogTitle className='sr-only'>Select a Report Template</DialogTitle>
        <DialogDescription className='sr-only'>
          Choose a template to use for your report.
        </DialogDescription>
        <SidebarProvider className='items-start'>
          <Sidebar collapsible='none' className='hidden md:flex'>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {templates.map((tpl, idx) => (
                      <SidebarMenuItem key={tpl.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={selectedIdx === idx}
                        >
                          <button
                            type='button'
                            className='w-full flex items-center gap-2 px-2 py-2 text-left'
                            onClick={() => setSelectedIdx(idx)}
                          >
                            <span className='font-semibold'>{tpl.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className='flex h-[740px] flex-1 flex-col overflow-hidden'>
            <header className='flex h-16 shrink-0 items-center gap-2 px-4'>
              <div className='font-semibold text-lg'>
                {selectedTemplate.name}
              </div>
            </header>
            <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0'>
              <div className='mb-2 font-medium text-base'>
                {selectedTemplate.description}
              </div>
              <div className='border rounded overflow-hidden bg-white w-full h-[600px]'>
                <iframe
                  title='Template Preview'
                  srcDoc={selectedTemplate.template}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'white',
                  }}
                />
              </div>
            </div>
            <DialogFooter className='px-4 pb-4'>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    onSelect(selectedTemplate.template)
                    onOpenChange(false)
                  }
                }}
              >
                Use this Template
              </Button>
            </DialogFooter>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
