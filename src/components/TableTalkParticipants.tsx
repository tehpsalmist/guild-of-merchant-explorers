import { CheckCircleIcon, MicrophoneIcon, WifiIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import type { P2PRoom } from '../p2p-connection/p2p-room'
import type { PeerState } from '../p2p-connection/p2p-connection'
import { usePlayerList } from '../hooks/usePlayerList'
import type { VoiceChatState } from '../hooks/useVoiceChat'
import clsx from 'clsx'

const ConnectionStatus = ({ state }: { state: PeerState }) => {
  if (state === 'connected') return <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-label="Connected" />
  if (state === 'connecting') return <WifiIcon className="h-3.5 w-3.5 shrink-0 animate-pulse text-orange-400" aria-label="Connecting" />
  return <XCircleIcon className="h-3.5 w-3.5 shrink-0 text-red-400" aria-label="Not connected" />
}

export const TableTalkParticipants = ({
  room,
  voice,
  className,
}: {
  room: P2PRoom
  voice: VoiceChatState
  className?: string
}) => {
  const { userLookup } = usePlayerList()
  const [peerStates, setPeerStates] = useState<Record<number, PeerState>>({})

  useEffect(() => {
    const update = ({ memberId, state }: { memberId: number; state: PeerState }) => {
      setPeerStates((current) => ({ ...current, [memberId]: state }))
    }
    room.on('peer-state', update)
    setPeerStates(Object.fromEntries(room.getPeers().map(({ memberId, state }) => [memberId, state])))
    return () => {
      room.off('peer-state', update)
    }
  }, [room])

  return (
    <div className={clsx('flex flex-wrap gap-x-3 gap-y-1 border-b border-amber-100/10 px-4 py-2 text-xs text-amber-100/55', className)}>
      {room.members.filter((member) => member.invite_accepted).map((member) => (
        <span key={member.id} className="inline-flex max-w-32 items-center gap-1 truncate">
          <span className="truncate">{member.id === room.myId ? 'You' : (userLookup[member.player_id]?.displayName ?? 'Explorer')}</span>
          {voice.mutedMembers[member.id] && (
            <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center text-red-400" aria-label="Microphone muted">
              <MicrophoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="absolute h-px w-[1.05rem] rotate-45 bg-current" aria-hidden="true" />
            </span>
          )}
          <ConnectionStatus state={member.id === room.myId ? 'connected' : (peerStates[member.id] ?? 'not-in-room')} />
        </span>
      ))}
    </div>
  )
}
