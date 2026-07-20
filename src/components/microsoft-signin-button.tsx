import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Official Microsoft four-square logo (brand colors are fixed by Microsoft's
 * branding guidelines and must not be recolored).
 */
function MicrosoftLogo({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="21"
            height="21"
            viewBox="0 0 21 21"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
    )
}

interface MicrosoftSignInButtonProps {
    onClick?: () => void
    disabled?: boolean
    loading?: boolean
    className?: string
    /** Button label. Microsoft's guideline default is "Sign in with Microsoft". */
    label?: string
}

/**
 * "Sign in with Microsoft" button following Microsoft's branding guidance:
 * white button in light mode, #2F2F2F in dark mode, the four-square logo, and
 * the standard label. See:
 * https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps
 */
export function MicrosoftSignInButton({
    onClick,
    disabled,
    loading,
    className,
    label = 'Sign in with Microsoft',
}: MicrosoftSignInButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            aria-label={label}
            className={cn(
                'inline-flex h-11 items-center justify-center gap-3 rounded-2xl border px-5',
                'text-[15px] font-semibold transition-all',
                // Light: white button, dark grey text (per Microsoft spec #5E5E5E)
                'border-[#8C8C8C] bg-white text-[#5E5E5E] hover:bg-neutral-50',
                // Dark: #2F2F2F button, white text
                'dark:border-[#2F2F2F] dark:bg-[#2F2F2F] dark:text-white dark:hover:bg-[#3A3A3A]',
                'shadow-lg hover:scale-105 active:scale-95',
                'disabled:pointer-events-none disabled:opacity-60',
                className,
            )}
        >
            {loading ? (
                <Loader2 className="size-5 animate-spin" />
            ) : (
                <MicrosoftLogo className="size-5" />
            )}
            <span>{label}</span>
        </button>
    )
}
