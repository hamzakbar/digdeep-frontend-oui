import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DeleteSessionDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isDeleting: boolean
}

export function DeleteSessionDialog({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
}: DeleteSessionDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Delete Session?</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Are you sure you want to delete this session? This action cannot be undone and all data will be permanently lost.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        className="rounded-xl flex-1"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        className="rounded-xl flex-1 px-6 bg-destructive hover:bg-destructive/90"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
