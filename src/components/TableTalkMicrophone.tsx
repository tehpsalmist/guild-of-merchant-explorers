import { MicrophoneIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { VoiceChatState } from '../hooks/useVoiceChat'

export const TableTalkMicrophone = ({ voice }: { voice: VoiceChatState }) => (
  <button
    type="button"
    onClick={voice.toggleMute}
    aria-label={voice.muted ? 'Unmute my microphone' : 'Mute my microphone'}
    aria-pressed={voice.muted}
    title={voice.muted ? 'Your microphone is muted' : 'Your microphone is on'}
    className={clsx(
      'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-amber-200',
      voice.muted
        ? 'border-amber-100/15 text-amber-100/60 hover:bg-slate-900'
        : 'border-emerald-300/50 bg-emerald-500/25 text-emerald-200',
    )}
  >
    <MicrophoneIcon className="h-5 w-5" aria-hidden="true" />
    {voice.muted && <span className="absolute h-px w-6 rotate-45 bg-current" aria-hidden="true" />}
  </button>
)
