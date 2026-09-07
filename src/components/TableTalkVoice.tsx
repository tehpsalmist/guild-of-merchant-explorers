import { MicrophoneIcon } from '@heroicons/react/24/outline'
import type { P2PRoom } from '../p2p-connection/p2p-room'
import type { VoiceChatState } from '../hooks/useVoiceChat'
import { usePlayerList } from '../hooks/usePlayerList'
import clsx from 'clsx'

export const TableTalkVoice = ({
  room,
  voice,
  className,
}: {
  room: P2PRoom
  voice: VoiceChatState
  className?: string
}) => {
  const { userLookup } = usePlayerList()

  return (
    <div className={clsx('flex shrink-0 items-center gap-3 border-b border-amber-100/10 px-4 py-2', className)}>
      <div className="flex min-w-0 grow flex-wrap gap-x-3 gap-y-1 text-xs text-amber-100/55">
        {room.members.filter((member) => member.invite_accepted).map((member) => {
          const player = userLookup[member.player_id]
          const isMine = member.id === room.myId
          return (
            <span key={member.id} className="inline-flex min-w-0 items-center gap-1">
              <span className="max-w-32 truncate">{isMine ? 'You' : (player?.displayName ?? 'Explorer')}</span>
              {voice.memberStates[member.id] && (
                <MicrophoneIcon className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-label="Voice enabled" />
              )}
            </span>
          )
        })}
      </div>
      <button
        type="button"
        className={clsx(
          'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50',
          voice.enabled
            ? 'border-emerald-300/50 bg-emerald-500/25 text-emerald-200'
            : 'border-amber-100/15 text-amber-100/60 hover:bg-slate-900 hover:text-amber-50',
        )}
        onClick={voice.toggle}
        disabled={voice.changing}
        aria-pressed={voice.enabled}
        aria-label={voice.enabled ? 'Disable voice chat' : 'Enable voice chat'}
        title={voice.enabled ? 'Voice chat on' : 'Voice chat off'}
      >
        <MicrophoneIcon className="h-5 w-5" aria-hidden="true" />
        {!voice.enabled && <span className="absolute h-px w-6 rotate-45 bg-current" aria-hidden="true" />}
      </button>
    </div>
  )
}
