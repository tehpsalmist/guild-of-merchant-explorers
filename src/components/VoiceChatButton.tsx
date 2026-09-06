import clsx from 'clsx'
import { MicrophoneIcon } from '@heroicons/react/24/outline'

export const VoiceChatButton = ({
  enabled,
  changing,
  onClick,
  className,
}: {
  enabled: boolean
  changing: boolean
  onClick(): void
  className?: string
}) => (
  <button
    type="button"
    className={clsx(
      'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50',
      enabled
        ? 'border-emerald-300/50 bg-emerald-500/25 text-emerald-200'
        : 'border-amber-100/15 text-amber-100/60 hover:bg-slate-900 hover:text-amber-50',
      className,
    )}
    onClick={onClick}
    disabled={changing}
    aria-pressed={enabled}
    aria-label={enabled ? 'Disable voice chat' : 'Enable voice chat'}
    title={enabled ? 'Voice chat on' : 'Voice chat off'}
  >
    <MicrophoneIcon className="h-5 w-5" aria-hidden="true" />
    {!enabled && <span className="absolute h-px w-6 rotate-45 bg-current" aria-hidden="true" />}
  </button>
)
